# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| 1.0.x   | :x:                |

## Reporting a Vulnerability

**DO NOT** open public issues for security vulnerabilities.

### How to Report
1. Email: security@coffee-export-consortium.com
2. Include detailed description
3. Provide steps to reproduce
4. Suggest a fix if possible

### Response Timeline
- **24 hours**: Initial acknowledgment
- **7 days**: Preliminary assessment
- **30 days**: Fix and disclosure

## Security Measures

### Authentication
- JWT tokens with 24h expiry
- Password hashing (bcrypt)
- Rate limiting on auth endpoints

### Network Security
- TLS 1.3 for all communications
- Mutual TLS between peers
- Certificate-based identity

### Data Protection
- Encryption at rest (AES-256)
- Encryption in transit (TLS)
- Input sanitization
- SQL injection prevention

### Access Control
- Role-based access control (RBAC)
- Principle of least privilege
- Audit logging

## Best Practices

### For Developers
- Never commit secrets
- Use environment variables
- Validate all inputs
- Follow OWASP guidelines
- Keep dependencies updated

### For Operators
- Rotate secrets regularly
- Monitor access logs
- Apply security patches promptly
- Use strong passwords
- Enable 2FA where possible

## Security Audits
Regular security audits are conducted quarterly.
