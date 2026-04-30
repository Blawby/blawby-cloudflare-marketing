# AI Chat & Conversation Rules

## Core Features Covered
- AI chat widget integration and configuration
- Real-time messaging with WebSocket connections
- Anonymous to authenticated user flow conversion
- Client intake automation and form integration
- Conversation management and participant handling
- File attachments and document sharing in conversations
- Message persistence and sequence management

## React Component Rules

### AI Chat Components
- **Widget Integration**: Always use unique conversation IDs for `key` props when rendering multiple chat instances
- **WebSocket Management**: Properly handle connection states, reconnection logic, and error boundaries
- **Message Rendering**: Use stable message IDs for rendering lists, implement virtual scrolling for long conversations

### Conversation UI Components
- **Participant Avatars**: Use consistent user ID-based styling and fallbacks
- **Message Status**: Implement real-time delivery, read receipts, and typing indicators
- **File Attachments**: Handle upload states, preview generation, and download functionality

## MDX Content Rules

### AI Chat Documentation Structure
- **Setup Flow**: Always document in order: widget installation → configuration → testing → customization
- **Feature Integration**: Show how chat connects to payments, intake forms, and practice management
- **User Journey**: Document anonymous → authenticated flow with clear state transitions

### Conversation Management Documentation
- **Sequence Numbering**: Explain message sequence persistence and gap handling
- **Participant Management**: Document user roles, permissions, and access controls
- **File Handling**: Cover attachment types, size limits, and security considerations

## Development Rules

### 1. New AI Chat Content Must Include:
   - Widget installation and configuration steps
   - WebSocket connection requirements and troubleshooting
   - Anonymous user flow and authentication transition
   - Integration with existing payment and intake systems
   - Error handling and fallback scenarios

### 2. Conversation Management Content:
   - Real-time messaging architecture overview
   - Message persistence and sequence validation
   - Participant access control and permissions
   - File attachment and document sharing workflows
   - Cross-device synchronization and session management

### 3. Technical Requirements:
   - WebSocket endpoint documentation with authentication
   - Message format specifications and examples
   - Event handling for real-time updates
   - Error codes and troubleshooting guides
   - Performance optimization and scaling considerations

### 4. Integration Examples:
   - React component integration patterns
   - Custom widget styling and branding
   - Third-party CRM and practice management integration
   - Mobile app implementation considerations
   - Accessibility and responsive design requirements

## Content Guidelines

### Focus Areas
- **User Experience**: Emphasize seamless anonymous to authenticated transitions
- **Automation Benefits**: Highlight reduced manual intake and improved client engagement
- **Integration Simplicity**: Focus on easy setup and minimal technical overhead
- **Security & Compliance**: Address data privacy, encryption, and legal industry requirements
- **Performance**: Document real-time responsiveness and reliability

### Key Messaging Points
- AI chat reduces friction in client acquisition
- Automated intake saves staff time and improves data quality
- Real-time messaging improves client satisfaction and retention
- Seamless integration with existing practice workflows
- Professional, compliant communication tools built for legal practices

## Technical Documentation Standards

### API Documentation Format
```typescript
// WebSocket connection example (browser)
// DO NOT include authentication tokens in the URL.
// Instead, exchange your session token for a short-lived, single-use WebSocket token.
const wsToken = await obtainWebsocketToken(conversationId);
const wsUrl = `wss://api.blawby.com/conversations/${conversationId}/ws?wsToken=${encodeURIComponent(wsToken)}&practiceId=${encodeURIComponent(practiceId)}`;
const ws = new WebSocket(wsUrl);

/**
 * SECURITY NOTE: The token-exchange flow (obtaining a 'wsToken') ensures that 
 * long-lived credentials are never exposed in logs or browser history via URL parameters.
 * The 'wsToken' should have a short expiry (e.g., 60s), be single-use, 
 * and ideally be bound to the requesting IP.
 */

// For Node.js server-side usage with ws library:
// Prefer using headers for sensitive values to avoid URL leakage.
// const ws = new WebSocket(`wss://api.blawby.com/conversations/${conversationId}/ws`, [], {
//   headers: {
//     'Authorization': `Bearer ${token}`,
//     'Practice-Id': practiceId
//   }
// });
```

### Message Format Examples
```typescript
interface ChatMessage {
  id: string;
  conversation_id: string;
  user_id: string | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  seq: number;
  created_at: string;
  attachments?: Attachment[];
  metadata?: Record<string, unknown>;
}
```

### Integration Code Samples
- React hooks for WebSocket management
- Form integration with intake automation
- File upload handling with progress indicators
- Error boundary implementations for chat components

## SEO Requirements for AI Chat Content

### Target Keywords
- "AI chat for law firms"
- "automated client intake"
- "real-time messaging legal"
- "anonymous to authenticated flow"
- "legal practice chat automation"
- "client communication automation"
- "law firm chat widget"

### Content Structure
- Use problem-solution format for user pain points
- Include step-by-step implementation guides
- Provide troubleshooting sections for common issues
- Add FAQ sections addressing security and compliance concerns
- Include case studies and success metrics where applicable

## Performance & Accessibility Requirements

### Performance Standards
- WebSocket connection establishment under 500ms
- Message delivery confirmation under 200ms
- File upload progress indicators for attachments >1MB
- Offline message queuing and synchronization
- Memory-efficient message history management

### Accessibility Compliance
- Screen reader support for real-time messages
- Keyboard navigation for chat interfaces
- High contrast mode support
- Font size scalability
- Voice-to-text integration considerations

## Security & Compliance Guidelines

### Data Protection
- End-to-end encryption for sensitive communications
- Secure WebSocket connections (WSS only)
- Data retention policies and user consent
- GDPR and privacy law compliance
- Attorney-client privilege considerations

### Authentication & Authorization
- Anonymous user session management
- Secure authentication token handling
- Role-based access control for conversations
- Practice member verification and permissions
- Cross-origin security policies

## Testing Requirements

### Functional Testing
- WebSocket connection reliability under various network conditions
- Message persistence and sequence validation
- File upload and download functionality
- Anonymous to authenticated user flow transitions
- Cross-browser compatibility testing

### Performance Testing
- Concurrent user connection limits
- Message throughput and latency measurements
- Memory usage under high message volumes
- Database query optimization for conversation history
- CDN performance for static assets and file attachments
