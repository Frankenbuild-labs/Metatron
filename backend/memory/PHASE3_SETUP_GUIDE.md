# Phase 3: RASA Conversation Management Integration - Setup Guide

## 🎯 Overview

Phase 3 adds RASA-inspired conversation management capabilities to your memory system. This creates sophisticated dialogue state tracking, multi-agent orchestration, and memory-aware conversation flows that make your AI interactions more intelligent and context-aware.

## 🎭 Conversation Management Architecture

### **RASA-Inspired Principles**
1. **Dialogue State Tracking** - Maintains conversation context and flow
2. **Flow Management** - Sophisticated conversation patterns and workflows
3. **Agent2Agent (A2A) Protocol** - Standardized agent interoperability
4. **Multi-Agent Orchestration** - Coordinates multiple AI agents
5. **Memory-Aware Dialogues** - Integrates with memory and learning systems

### **Conversation Components**
```
Conversation System
├── State Management (Track dialogue context)
├── Flow Execution (Conversation patterns)
├── Agent Orchestration (Multi-agent coordination)
├── A2A Protocol (Agent interoperability)
└── Memory Integration (Context-aware responses)
```

## 🚀 New Features Added

### **1. Conversation Management API**
- **Start**: `POST /api/conversation/start` - Begin new conversation
- **Message**: `POST /api/conversation/message` - Process conversation messages
- **Session**: `GET /api/conversation/session/{id}` - Get session details
- **Sessions**: `GET /api/conversation/sessions` - List user sessions
- **Flows**: `GET /api/conversation/flows` - Available conversation flows
- **Agents**: `GET /api/conversation/agents` - Registered agents
- **Stats**: `GET /api/conversation/stats` - Conversation statistics

### **2. Conversation States**
| **State** | **Purpose** | **Description** |
|-----------|-------------|-----------------|
| `idle` | Waiting | No active conversation |
| `listening` | Active | Ready for user input |
| `processing` | Working | Processing user message |
| `flow_execution` | Guided | Following conversation flow |
| `agent_handoff` | Delegated | Agent handling request |
| `waiting_for_input` | Paused | Waiting for user response |
| `completed` | Finished | Conversation completed |
| `error` | Failed | Error state |

### **3. Conversation Flows**
- **Simple Q&A** - Basic question-answer interactions
- **Memory Interaction** - Memory-related queries and operations
- **Multi-Step Task** - Complex workflows with multiple steps
- **Agent Coordination** - Multi-agent collaborative tasks
- **Tool Usage** - System tool and function interactions

### **4. A2A Protocol Implementation**
- **Agent Discovery** - Find and register agents
- **Task Delegation** - Send tasks to specialized agents
- **Status Tracking** - Monitor agent task progress
- **Result Integration** - Combine agent responses

### **5. Frontend Conversation Interface**
- **State Indicator** - Shows current conversation state
- **Flow Display** - Active conversation flow information
- **Agent Management** - View and manage registered agents
- **Session Controls** - Reset, view history, manage sessions

## 📋 Setup Instructions

### **Prerequisites**
- Phase 1 (MEM0AI) and Phase 2 (VANNA Learning) must be completed
- Python packages: `aiohttp`, `asyncio` (for A2A protocol)

### **1. Install Additional Dependencies**

```bash
cd backend/memory
pip install aiohttp>=3.8.0
pip install asyncio-mqtt>=0.11.0  # Optional for MQTT support
```

### **2. Verify Conversation System**

```bash
# Test conversation health
curl http://localhost:5006/api/conversation/health

# Expected response:
{
  "status": "healthy",
  "service": "metatron-conversation",
  "conversation_stats": {...},
  "timestamp": "2025-01-21T..."
}
```

### **3. Test Conversation Functionality**

```bash
# Start a conversation
curl -X POST http://localhost:5006/api/conversation/start \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "message": "Hello, I need help with memory management"
  }'

# Process a message
curl -X POST http://localhost:5006/api/conversation/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "your_session_id",
    "message": "Show me my memories",
    "message_type": "user"
  }'
```

## 🎨 Frontend Features

### **1. Enhanced Chat Interface**
- **Conversation State Indicator** - Shows current dialogue state
- **Flow Information** - Displays active conversation flow
- **Message Types** - User, Assistant, Agent, System messages
- **State-Aware Responses** - Context-aware AI responses

### **2. Conversation Controls Panel**
- **Session Information** - Current session ID and state
- **Agent Count** - Number of registered agents
- **Flow Management** - View available conversation flows
- **Agent Management** - View and manage registered agents
- **Session Reset** - Start fresh conversation

### **3. Brain Button Enhancement**
- **Conversation Indicator** - Cyan pulse when conversation management is active
- **Multi-Status Display** - Shows memory, learning, and conversation status
- **Integrated Health** - Combined system health monitoring

## 🔧 Conversation Flow Examples

### **1. Memory Interaction Flow**
```
User: "Remember that I prefer dark mode"
  ↓
State: processing → flow_execution
  ↓
Flow: memory_interaction
  ↓
Action: Store in OCCIPITAL_LOBE (personal memory)
  ↓
Response: "I've remembered your preference for dark mode"
  ↓
State: completed
```

### **2. Multi-Agent Coordination**
```
User: "Generate an image and then create a video from it"
  ↓
State: processing → agent_handoff
  ↓
Agent 1: Image generation agent
  ↓
Agent 2: Video generation agent
  ↓
Coordination: Pass image from Agent 1 to Agent 2
  ↓
Response: Combined result from both agents
  ↓
State: completed
```

### **3. Learning-Enhanced Conversation**
```
User: "How do I use the memory system?"
  ↓
Learning: Retrieve similar successful patterns
  ↓
Memory: Search for relevant memories
  ↓
Flow: Enhanced response using learned patterns
  ↓
Response: Improved answer based on previous interactions
  ↓
Learning: Record successful interaction pattern
```

## 📊 Conversation Metrics

### **Flow Types**
- **simple_qa** - Basic question-answer flows
- **memory_interaction** - Memory-related operations
- **multi_step_task** - Complex multi-step workflows
- **agent_coordination** - Multi-agent collaborative tasks
- **tool_usage** - System tool interactions
- **learning_feedback** - Learning and feedback flows

### **State Tracking**
- **Session Duration** - How long conversations last
- **Flow Completion Rate** - Success rate of conversation flows
- **Agent Usage** - Which agents are used most frequently
- **Brain Region Distribution** - Memory usage across brain regions

### **Performance Metrics**
- **Response Time** - How quickly system responds
- **Flow Efficiency** - Steps required to complete tasks
- **User Satisfaction** - Based on feedback and completion rates
- **Context Retention** - How well context is maintained

## 🤖 A2A Protocol Usage

### **Agent Registration**
```python
# Register an agent
async with A2AProtocol(config) as protocol:
    success = await protocol.register_agent("http://localhost:8080/agent")
    if success:
        print("Agent registered successfully")
```

### **Task Delegation**
```python
# Send task to agent
response = await protocol.send_task(
    agent_id="image_generator",
    message="Generate a sunset landscape image",
    context={"style": "photorealistic", "size": "1024x1024"}
)
```

### **Status Monitoring**
```python
# Check task status
status = await protocol.get_task_status(task_id)
if status.status.state == AgentState.COMPLETED:
    print("Task completed successfully")
```

## 🔍 Testing & Validation

### **1. Conversation Flow Test**
```javascript
// Frontend test - start conversation
const response = await fetch('/api/conversation/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        user_id: 'test_user',
        message: 'I want to remember something important'
    })
});
```

### **2. State Management Test**
```bash
# Test state transitions
curl -X PUT http://localhost:5006/api/conversation/session/SESSION_ID/state \
  -H "Content-Type: application/json" \
  -d '{"state": "processing"}'
```

### **3. Flow Execution Test**
```bash
# Test flow listing
curl http://localhost:5006/api/conversation/flows
```

## 🎯 Integration Points

### **1. Memory System Integration**
- Conversation flows can trigger memory operations
- Memory context influences conversation responses
- Brain region classification affects conversation flow

### **2. Learning System Integration**
- Successful conversations become learning patterns
- User feedback improves conversation flows
- Pattern recognition enhances response quality

### **3. Agent System Integration**
- A2A protocol enables agent interoperability
- Conversation flows can delegate to specialized agents
- Multi-agent coordination for complex tasks

## 🚀 Advanced Features

### **1. Custom Flow Creation**
```json
{
  "flow_id": "custom_workflow",
  "flow_name": "Custom Workflow",
  "flow_type": "multi_step_task",
  "trigger_patterns": ["workflow", "process", "steps"],
  "steps": [
    {"type": "input_collection", "data": {"variable": "task_name"}},
    {"type": "agent_call", "data": {"agent_id": "task_processor"}},
    {"type": "memory_query", "data": {"query": "similar tasks"}},
    {"type": "message", "data": {"template": "Task {task_name} completed"}}
  ]
}
```

### **2. Agent Capability Definition**
```json
{
  "agent_id": "image_generator",
  "agent_name": "Image Generation Agent",
  "skills": [
    {"name": "text_to_image", "description": "Generate images from text"},
    {"name": "style_transfer", "description": "Apply artistic styles"}
  ],
  "input_modes": ["text", "json"],
  "output_modes": ["image", "json"],
  "brain_regions": ["CEREBELLUM", "TEMPORAL_LOBE"]
}
```

## 🔄 Next Steps

After Phase 3 is working:

1. **Test Conversation Flows** - Verify all conversation patterns work
2. **Register Custom Agents** - Add specialized agents for your use cases
3. **Create Custom Flows** - Design conversation patterns for specific tasks
4. **Phase 4** - Unified Memory API Service Integration

## 📞 Support

### **Common Issues**

1. **Conversation Not Starting**
   - Check if conversation endpoints are accessible
   - Verify session management is working
   - Check browser console for JavaScript errors

2. **Flows Not Executing**
   - Ensure flow patterns match user input
   - Check flow step configuration
   - Verify brain region compatibility

3. **Agents Not Responding**
   - Check agent registration status
   - Verify A2A protocol configuration
   - Test agent endpoints directly

### **Debug Commands**
```bash
# Check conversation service
curl http://localhost:5006/api/conversation/health

# View conversation stats
curl http://localhost:5006/api/conversation/stats

# List active sessions
curl http://localhost:5006/api/conversation/sessions
```

## 🎉 Success Indicators

✅ **Conversation service health check passes**
✅ **Conversation state indicator appears in chat**
✅ **Conversation flows are listed and accessible**
✅ **Messages are processed through conversation management**
✅ **Brain button shows conversation indicator**
✅ **Session management works correctly**

Your memory system now has sophisticated conversation management with state tracking, flow execution, and agent orchestration! 🎭✨
