import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Types matches the backend schemas
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  stock: number;
}

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  email: string;
  items: OrderItem[];
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';
  trackingNumber: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  name?: string;
  isToolCall?: boolean;
  toolName?: string;
  toolArgs?: string;
  toolOutput?: string;
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeAgent, setActiveAgent] = useState('TriageAgent');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate stable Session ID on mount
  useEffect(() => {
    let sId = localStorage.getItem('support_session_id');
    if (!sId) {
      sId = 'sess-' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('support_session_id', sId);
    }
    setSessionId(sId);
    fetchStoreData();
  }, []);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, loading]);

  // Fetch product catalog and order database
  const fetchStoreData = async () => {
    try {
      const prodRes = await fetch('http://localhost:5000/api/products');
      const prodData = await prodRes.json();
      setProducts(prodData);

      const orderRes = await fetch('http://localhost:5000/api/orders');
      const orderData = await orderRes.json();
      setOrders(orderData);
    } catch (err) {
      console.error('Error fetching store data:', err);
    }
  };

  // Parses raw OpenAI Agents SDK history items to a clean format for UI rendering
  const parseHistory = (historyItems: any[]): ChatMessage[] => {
    const parsed: ChatMessage[] = [];
    
    historyItems.forEach((item, index) => {
      const id = item.id || `msg-${index}`;
      
      // 1. User messages
      if (item.role === 'user') {
        parsed.push({
          id,
          role: 'user',
          content: typeof item.content === 'string' ? item.content : JSON.stringify(item.content)
        });
        return;
      }
      
      // 2. Assistant messages (LLM responses or Tool invocations)
      if (item.role === 'assistant') {
        let textContent = '';
        if (typeof item.content === 'string') {
          textContent = item.content;
        } else if (Array.isArray(item.content)) {
          textContent = item.content
            .map((c: any) => c.text || c.output_text || '')
            .join('');
        }
        
        const toolCalls = item.tool_calls || item.raw_item?.tool_calls || [];
        
        // Add text answer if present
        if (textContent.trim()) {
          parsed.push({
            id,
            role: 'assistant',
            content: textContent,
            name: item.name || item.agentName || 'TriageAgent'
          });
        }
        
        // Log tool calls
        if (toolCalls && toolCalls.length > 0) {
          toolCalls.forEach((tc: any, tcIdx: number) => {
            parsed.push({
              id: `${id}-tc-${tcIdx}`,
              role: 'system',
              content: `Calling tool: ${tc.function?.name || tc.name}`,
              isToolCall: true,
              toolName: tc.function?.name || tc.name,
              toolArgs: tc.function?.arguments || tc.arguments
            });
          });
        }
        return;
      }
      
      // 3. Tool Output messages
      if (item.role === 'tool' || item.type === 'tool_call_output') {
        parsed.push({
          id,
          role: 'tool',
          content: item.output || item.content || '',
          name: item.name || item.toolName || 'system'
        });
        return;
      }
    });
    
    return parsed;
  };

  // Submit chat message to backend
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMessageText = inputText;
    setInputText('');
    setLoading(true);

    // Optimistically add user message to chat pane
    const tempUserMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: userMessageText
    };
    setChatMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: userMessageText })
      });
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Update active agent and chat log
      setActiveAgent(data.activeAgent);
      const parsedLogs = parseHistory(data.history);
      setChatMessages(parsedLogs);

      // Refresh mock DB values since agent could have cancel/refunded order or checked catalog
      await fetchStoreData();
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'system',
          content: `System Error: ${err.message || 'Could not communicate with the support agent.'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Reset chat session
  const handleResetSession = async () => {
    if (window.confirm('Are you sure you want to clear chat history and reset agent conversation?')) {
      setLoading(true);
      try {
        await fetch('http://localhost:5000/api/chat/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });
        setChatMessages([]);
        setActiveAgent('TriageAgent');
      } catch (err) {
        console.error('Error resetting session:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Click handler to suggest queries
  const handleSuggestText = (text: string) => {
    setInputText(text);
  };

  // Filter products locally by search bar
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter orders locally by email search bar
  const filteredOrders = orders.filter(o => 
    o.email.toLowerCase().includes(lookupEmail.toLowerCase()) ||
    o.id.toLowerCase().includes(lookupEmail.toLowerCase())
  );

  // Helper to resolve agent specific theme classes
  const getAgentThemeClass = (agentName: string) => {
    if (agentName.includes('Catalog')) return 'glow-catalog';
    if (agentName.includes('Order')) return 'glow-orders';
    return 'glow-triage';
  };

  return (
    <div className="app-container">
      
      {/* LEFT PANEL: Mock Store DB viewer */}
      <div className="sidebar-panel">
        <div className="sidebar-header">
          <h1>Apex Store Database</h1>
          <p>Live inventory & customer transactions lookup (Mock Database)</p>
        </div>

        <div className="sidebar-content">
          
          {/* Section 1: Catalog Inventory */}
          <div className="panel-section">
            <div className="section-title">
              <span>Product Inventory</span>
              <span className="db-badge">{products.length} Items</span>
            </div>
            
            <input 
              type="text" 
              placeholder="Search catalog by name or category..." 
              className="chat-input"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', borderRadius: '8px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="products-grid">
              {filteredProducts.map(p => (
                <div 
                  key={p.id} 
                  className="product-card"
                  onClick={() => handleSuggestText(`Tell me details about product ${p.id}`)}
                  title="Click to ask support about this product"
                >
                  <div className="product-header">
                    <span className="product-category">{p.category}</span>
                    <span className="product-id">{p.id}</span>
                  </div>
                  <div className="product-name">{p.name}</div>
                  <div className="product-desc">{p.description}</div>
                  <div className="product-footer">
                    <span className="product-price">${p.price}</span>
                    <span className={`product-stock ${p.stock > 0 ? 'stock-in' : 'stock-out'}`}>
                      {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="empty-state">No products found.</div>
              )}
            </div>
          </div>

          {/* Section 2: Order Transactions */}
          <div className="panel-section">
            <div className="section-title">
              <span>Customer Orders Log</span>
              <span className="db-badge">{orders.length} Placed</span>
            </div>

            <input 
              type="text" 
              placeholder="Filter orders by Email or Order ID..." 
              className="chat-input"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', borderRadius: '8px' }}
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
            />

            <div className="orders-list">
              {filteredOrders.map(o => (
                <div key={o.id} className="order-row">
                  <div className="order-row-header">
                    <span className="order-id-block">{o.id}</span>
                    <span className="order-email">{o.email}</span>
                  </div>
                  
                  <div className="order-items-list">
                    {o.items.map((item, idx) => (
                      <div key={idx}>
                        • {item.name} (x{item.quantity}) — ${item.price}
                      </div>
                    ))}
                  </div>

                  <div className="order-footer">
                    <span className="order-total">Total: ${o.total.toFixed(2)}</span>
                    <span className={`order-status status-${o.status.toLowerCase()}`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
              {filteredOrders.length === 0 && (
                <div className="empty-state">No orders found.</div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* RIGHT PANEL: AI Support Chat Agent */}
      <div className="chat-panel">
        
        {/* Chat header showing Active Agent and Handoff State */}
        <div className="chat-header">
          <div className="chat-agent-info">
            <div className={`agent-status-glow ${getAgentThemeClass(activeAgent)}`}></div>
            <div className="agent-title-block">
              <h2>{activeAgent}</h2>
              <span>Active support specialist handling your session</span>
            </div>
          </div>
          <div className="chat-actions">
            <button className="btn-action" onClick={handleResetSession}>
              Clear History
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="messages-container">
          
          {/* Welcome/Guide message if chat is empty */}
          {chatMessages.length === 0 && (
            <div style={{ animation: 'fadeIn 0.4s ease', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
              <div className="empty-state" style={{ padding: '2rem', borderStyle: 'solid', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ fontFamily: 'var(--font-title)', color: 'white', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                  Welcome to Apex Customer Support!
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '1.25rem' }}>
                  Our AI Agent team is ready to assist you. Ask questions about products, check stock, look up order statuses, cancel orders, or request refunds.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                  <button 
                    className="btn-action"
                    onClick={() => handleSuggestText("What mechanical keyboards do you have?")}
                  >
                    🔍 Browse keyboards
                  </button>
                  <button 
                    className="btn-action"
                    onClick={() => handleSuggestText("Can you help me check order ORD-1001? My email is customer@example.com")}
                  >
                    📦 Track order ORD-1001
                  </button>
                  <button 
                    className="btn-action"
                    onClick={() => handleSuggestText("I want a refund on order ORD-1001, customer@example.com")}
                  >
                    💸 Refund order
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Map messages */}
          {chatMessages.map((msg) => {
            // Render Tool Invocations/Logs
            if (msg.role === 'system' && msg.isToolCall) {
              return (
                <div key={msg.id} className="tool-call-row">
                  <div className="tool-call-log">
                    <div className="tool-call-title">⚡ Running tool: {msg.toolName}</div>
                    <div>Parameters: {msg.toolArgs}</div>
                  </div>
                </div>
              );
            }

            if (msg.role === 'tool') {
              let displayOutput = msg.content;
              try {
                // Prettify JSON output from tool
                const parsed = JSON.parse(msg.content);
                displayOutput = JSON.stringify(parsed, null, 2);
              } catch(e) {}

              return (
                <div key={msg.id} className="tool-call-row">
                  <div className="tool-call-log">
                    <div className="tool-call-title">✅ Tool {msg.name} returned:</div>
                    <pre className="tool-call-output">{displayOutput}</pre>
                  </div>
                </div>
              );
            }

            // Render Standard Chat Bubbles
            const isUser = msg.role === 'user';
            const agentName = msg.name || 'TriageAgent';
            
            // Resolve agent text tag classes
            const getTagClass = (name: string) => {
              if (name.includes('Catalog')) return 'tag-catalog';
              if (name.includes('Order')) return 'tag-orders';
              return 'tag-triage';
            };

            return (
              <div key={msg.id} className={`message-row ${isUser ? 'msg-user' : 'msg-assistant'}`}>
                {!isUser && (
                  <span className={`msg-agent-tag ${getTagClass(agentName)}`}>
                    🤖 {agentName}
                  </span>
                )}
                <div className="message-bubble">
                  {msg.content}
                </div>
              </div>
            );
          })}

          {/* Typing/Loader state */}
          {loading && (
            <div className="message-row msg-assistant" style={{ opacity: 0.8 }}>
              <span className="msg-agent-tag tag-triage">🤖 Thinking</span>
              <div className="message-bubble" style={{ display: 'inline-flex' }}>
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat input box */}
        <form className="chat-input-bar" onSubmit={handleSendMessage}>
          <input
            type="text"
            className="chat-input"
            placeholder="Ask customer support anything..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn-send" disabled={loading || !inputText.trim()}>
            Send
          </button>
        </form>

      </div>

    </div>
  );
}
