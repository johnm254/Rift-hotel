export default function Loading({ full = false }) {
  if (full) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" style={{ borderTopColor: '#C9A96E', borderColor: '#243356', borderTopColor: '#C9A96E' }}></div>
          <p className="text-cream/70 text-sm tracking-widest uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20">
      <div className="spinner"></div>
    </div>
  );
}
