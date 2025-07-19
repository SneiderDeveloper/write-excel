function validateIp(){
  return (req, res, next) => {

    const IP_WHITELIST = process.env.IP_WHITELIST 
      ? process.env.IP_WHITELIST.split(',') 
      : []

    // If no IPs are configured, allow all
    if (IP_WHITELIST.length === 0 || IP_WHITELIST[0] === '') {
      return next()
    }

    // Get the client's real IP (considering proxies)
    const clientIP =  req.headers['x-forwarded-for']?.split(',')[0] || 
                      req.headers['x-real-ip'] || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress ||
                      req.ip

    const cleanIP = clientIP.replace(/^::ffff:/, '')

    if (!IP_WHITELIST.includes(cleanIP)) {
      return res.status(403).json({ 
        error: 'Access denied. IP not authorized.' 
      })
    }

    next()
  }
}

module.exports = validateIp