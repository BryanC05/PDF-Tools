function App() {
  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      {/* Header */}
      <header style={{
        maxWidth: '1200px',
        margin: '0 auto 40px',
        textAlign: 'center',
        color: 'white'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: '800',
          margin: '0 0 16px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
        }}>
          Simple PDF
        </h1>
        <p style={{
          fontSize: '20px',
          opacity: 0.95,
          margin: '0 0 8px'
        }}>
          Offline Client-Side PDF Suite
        </p>
        <p style={{
          fontSize: '16px',
          opacity: 0.9,
          margin: 0
        }}>
          Every tool you need to merge, split, and edit PDFs. 100% local inside your browser. Your files never leave your device.
        </p>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Section Style */}
        {renderSection('ORGANIZE PDF', [
          { name: 'Merge PDF', icon: '📄' },
          { name: 'Split PDF', icon: '✂️' },
          { name: 'Remove pages', icon: '🗑️' },
          { name: 'Extract pages', icon: '📑' },
          { name: 'Organize PDF', icon: '📋' },
          { name: 'Scan to PDF', icon: '📷' },
        ])}

        {renderSection('OPTIMIZE PDF', [
          { name: 'Compress PDF', icon: '📦' },
          { name: 'Repair PDF', icon: '🔧' },
          { name: 'OCR PDF', icon: '🔍' },
          { name: 'Grayscale', icon: '⚫' },
        ])}

        {renderSection('CONVERT TO PDF', [
          { name: 'JPG to PDF', icon: '🖼️' },
        ])}

        {renderSection('CONVERT FROM PDF', [
          { name: 'PDF to JPG', icon: '📸' },
          { name: 'PDF to PDF/A', icon: '📄' },
        ])}

        {renderSection('EDIT PDF', [
          { name: 'Rotate PDF', icon: '🔄' },
          { name: 'Add page numbers', icon: '🔢' },
          { name: 'Add watermark', icon: '💧' },
          { name: 'Crop PDF', icon: '✂️' },
          { name: 'Edit PDF', icon: '✏️' },
          { name: 'Sign PDF', icon: '✒️' },
          { name: 'Edit metadata', icon: '🏷️' },
          { name: 'Fill forms', icon: '📝' },
        ])}
      </main>

      {/* Footer */}
      <footer style={{
        maxWidth: '1200px',
        margin: '60px auto 20px',
        textAlign: 'center',
        color: 'white',
        opacity: 0.9,
        padding: '20px',
        borderTop: '1px solid rgba(255,255,255,0.2)'
      }}>
        <p style={{ margin: 0 }}>
          <strong>Simple PDF</strong> — All processing happens locally in your browser. Your files never leave your device.
        </p>
      </footer>
    </div>
  );
}

function renderSection(title: string, tools: Array<{ name: string; icon: string }>) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '24px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 14px 50px rgba(0,0,0,0.25)';
    }}
    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.2)';
    }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: '700',
        color: '#667eea',
        margin: '0 0 24px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {title}
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '20px'
      }}>
        {tools.map((tool, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '16px',
              borderRadius: '12px',
              transition: 'background 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
              e.currentTarget.style.background = '#f7f7f7';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div style={{
              fontSize: '40px',
              marginBottom: '12px'
            }}>
              {tool.icon}
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              {tool.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
