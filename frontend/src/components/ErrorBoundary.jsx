import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console so devtools / terminals capture it
    console.error('Uncaught error in ErrorBoundary:', error, info);
    this.setState({ error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'Inter, Arial', color: '#111' }}>
          <h2 style={{ color: '#b91c1c' }}>Lỗi giao diện — kiểm tra console</h2>
          <p>{String(this.state.error && this.state.error.toString())}</p>
          {this.state.info && (
            <details style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>
              {this.state.info.componentStack}
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
