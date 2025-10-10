import './Card.css'

const Card = ({ 
  children, 
  title, 
  subtitle,
  icon,
  actions,
  variant = 'default',
  className = '',
  ...props 
}) => {
  return (
    <div className={`card card-${variant} ${className}`} {...props}>
      {(title || icon || actions) && (
        <div className="card-header">
          <div className="card-header-content">
            {icon && <div className="card-icon">{icon}</div>}
            <div className="card-title-group">
              {title && <h3 className="card-title">{title}</h3>}
              {subtitle && <p className="card-subtitle">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  )
}

export default Card
