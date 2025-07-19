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
  if (!cssStyle) return;
  
  const styles = {};
  
  // Limpiar y parsear el CSS
  const cssRules = cssStyle
    .split(';')
    .map(rule => rule.trim())
    .filter(rule => rule.includes(':'))
    .map(rule => {
      const colonIndex = rule.indexOf(':');
      const property = rule.substring(0, colonIndex).trim().toLowerCase();
      const value = rule.substring(colonIndex + 1).trim();
      return { property, value };
    });
  
  cssRules.forEach(({ property, value }) => {
    switch (property) {
      case 'font-weight':
        if (!styles.font) styles.font = {};
        styles.font.bold = value === 'bold' || parseInt(value) >= 600;
        break;
        
      case 'font-style':
        if (!styles.font) styles.font = {};
        styles.font.italic = value === 'italic';
        break;
        
      case 'text-decoration':
        if (!styles.font) styles.font = {};
        styles.font.underline = value.includes('underline');
        break;
        
      case 'font-size':
        if (!styles.font) styles.font = {};
        const fontSize = parseFloat(value);
        if (!isNaN(fontSize)) {
          styles.font.size = fontSize;
        }
        break;
        
      case 'font-family':
        if (!styles.font) styles.font = {};
        styles.font.name = value.replace(/['"]/g, '').split(',')[0].trim();
        break;
        
      case 'color':
        if (!styles.font) styles.font = {};
        styles.font.color = { argb: convertColorToArgb(value) };
        break;
        
      case 'background-color':
        styles.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: convertColorToArgb(value) }
        };
        break;
        
      case 'text-align':
        if (!styles.alignment) styles.alignment = {};
        const alignmentMap = {
          'left': 'left',
          'center': 'center',
          'right': 'right',
          'justify': 'justify'
        };
        styles.alignment.horizontal = alignmentMap[value] || value;
        break;
        
      case 'vertical-align':
        if (!styles.alignment) styles.alignment = {};
        const verticalMap = {
          'top': 'top',
          'middle': 'middle',
          'bottom': 'bottom'
        };
        styles.alignment.vertical = verticalMap[value] || 'middle';
        break;
        
      case 'border':
        const borderStyle = parseBorderStyle(value);
        if (borderStyle) {
          styles.border = {
            top: borderStyle,
            left: borderStyle,
            bottom: borderStyle,
            right: borderStyle
          };
        }
        break;
        
      case 'border-top':
      case 'border-right':
      case 'border-bottom':
      case 'border-left':
        const side = property.split('-')[1];
        const sideStyle = parseBorderStyle(value);
        if (sideStyle) {
          if (!styles.border) styles.border = {};
          styles.border[side] = sideStyle;
        }
        break;
        
      case 'padding':
        if (!styles.alignment) styles.alignment = {};
        styles.alignment.indent = parseInt(value) || 0;
        break;
    }
  });
  
  // Aplicar estilos a la celda
  Object.keys(styles).forEach(styleType => {
    if (styles[styleType] && Object.keys(styles[styleType]).length > 0) {
      cell[styleType] = { ...cell[styleType], ...styles[styleType] };
    }
  });
}

module.exports = { applyCssToCell }