// Lista de IPs permitidas
const allowedIPs = [
  '127.0.0.1',           // localhost
  '::1',                 // localhost IPv6
  '192.168.1.100',       // IP específica
  '10.0.0.0/8',          // Rango de red (opcional)
  // Agrega más IPs según necesites
]

// Middleware para validar IP
const ipWhitelist = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress
  
  // Limpiar la IP (remover ::ffff: prefix si existe)
  const cleanIP = clientIP.replace(/^::ffff:/, '')
  
  console.log(`Request from IP: ${cleanIP}`)
  
  if (allowedIPs.includes(cleanIP)) {
    next()
  } else {
    console.log(`Blocked request from IP: ${cleanIP}`)
    res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Your IP address is not authorized to access this API',
      ip: cleanIP 
    })
  }
}

module.exports = ipWhitelist