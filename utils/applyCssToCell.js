// Función para convertir colores CSS a formato ARGB
const convertColorToArgb = (color) => {
  if (!color) return 'FF000000'
  
  color = color.trim().toLowerCase()
  
  if (color.startsWith('#')) {
    const hex = color.substring(1)
    if (hex.length === 3) {
      return 'FF' + hex.split('').map(char => char + char).join('').toUpperCase()
    }
    if (hex.length === 6) {
      return 'FF' + hex.toUpperCase()
    }
  }
  
  const colorMap = {
    'red': 'FFFF0000', 'green': 'FF008000', 'blue': 'FF0000FF',
    'black': 'FF000000', 'white': 'FFFFFFFF', 'yellow': 'FFFFFF00',
    'gray': 'FF808080', 'grey': 'FF808080', 'orange': 'FFFFA500',
    'purple': 'FF800080', 'pink': 'FFFFC0CB', 'brown': 'FFA52A2A'
  }
  
  return colorMap[color] || 'FF000000'
}

const parseBorderStyle = (borderValue) => {
  if (!borderValue) return null
  
  const parts = borderValue.trim().split(/\s+/)
  const width = parts.find(part => /^\d+px$/.test(part)) || '1px'
  const style = parts.find(part => ['solid', 'dashed', 'dotted', 'double'].includes(part)) || 'solid'
  const color = parts.find(part => part.startsWith('#') || /^[a-z]+$/.test(part)) || 'black'
  
  const excelStyle = {
    thin: 'thin',
    medium: 'medium',
    thick: 'thick',
    solid: 'thin',
    dashed: 'dashed',
    dotted: 'dotted',
    double: 'double'
  }
  
  return {
    style: excelStyle[style] || 'thin',
    color: { argb: convertColorToArgb(color) }
  }
}

// Función mejorada para aplicar estilos CSS a celdas
const applyCssToCell = (cell, cssStyle) => {
  if (!cssStyle) return
  
  const styles = {}
  const cssRules = cssStyle.split(';')
    .map(rule => rule.trim())
    .filter(rule => rule.includes(':'))
    .map(rule => {
      const [property, value] = rule.split(':').map(s => s.trim())
      return { property: property.toLowerCase(), value }
    })
  
  cssRules.forEach(({ property, value }) => {
    switch (property) {
      case 'font-weight':
        if (!styles.font) styles.font = {}
        styles.font.bold = value === 'bold' || parseInt(value) >= 600
        break
        
      case 'font-style':
        if (!styles.font) styles.font = {}
        styles.font.italic = value === 'italic'
        break
        
      case 'text-decoration':
        if (!styles.font) styles.font = {}
        styles.font.underline = value.includes('underline')
        break
        
      case 'font-size':
        if (!styles.font) styles.font = {}
        const fontSize = parseInt(value)
        if (!isNaN(fontSize)) styles.font.size = fontSize
        break
        
      case 'color':
        if (!styles.font) styles.font = {}
        styles.font.color = { argb: convertColorToArgb(value) }
        break
        
      case 'background-color':
        styles.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: convertColorToArgb(value) }
        }
        break
        
      case 'text-align':
        if (!styles.alignment) styles.alignment = {}
        styles.alignment.horizontal = value
        break
        
      case 'vertical-align':
        if (!styles.alignment) styles.alignment = {}
        styles.alignment.vertical = value === 'middle' ? 'middle' : value
        break
        
      case 'border':
        const borderStyle = parseBorderStyle(value)
        if (borderStyle) {
          styles.border = {
            top: borderStyle,
            left: borderStyle,
            bottom: borderStyle,
            right: borderStyle
          }
        }
        break

      case 'border-left':
        const side = property.split('-')[1]
        const sideStyle = parseBorderStyle(value)
        if (sideStyle) {
          if (!styles.border) styles.border = {}
          styles.border[side] = sideStyle
        }
        break
    }
  })
  
  Object.keys(styles).forEach(styleType => {
    cell[styleType] = { 
        ...cell[styleType], 
        ...styles[styleType] 
    }
  })

  return cell
}

module.exports = { applyCssToCell }