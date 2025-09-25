# Propuesta Comercial — Wind Consulting → SAPI Seguridad

Presentación comercial completa para SAPI Seguridad con **25 slides dinámicas**, sistema de gestión de costos automatizado y funcionalidad avanzada de exportación PDF.

## ✨ Características Principales

### 📊 **Sistema de Gestión de Costos**
- Actualización automática desde `costos.json`
- Cálculos dinámicos de fórmulas (CPL, ROI, ROAS)
- Formateo automático de moneda (MXN)
- Actualización en tiempo real de elementos HTML

### 🎯 **Slides Destacadas**
- **Slide 14**: Inversión de medios con desglose detallado
- **Slide 19**: Presupuesto de servicios (3 columnas optimizadas)
- **Slides 21-24**: Casos de éxito con métricas reales
- **25 slides totales** con contenido completo

### 📱 **Diseño Responsive**
- Optimizado para desktop y mobile
- Layouts adaptativos con CSS Grid
- Navegación fluida con teclado y mouse

### 🚀 **Nueva Funcionalidad: PDF Completo**
- **Botón "Descargar PDF Completo"** en la primera slide
- Captura todas las slides con estilos preservados
- Formato PPT (1920x1080) ideal para presentaciones
- Alta calidad con colores y gradientes intactos
- ✅ **Compatible con archivos locales** (sin errores CORS)
- ✅ **Manejo seguro de imágenes** (sin errores de canvas)

## 📁 Estructura del Proyecto

```
sapi_wind_presentation/
├── index.html          # Presentación principal (25 slides)
├── costos.js           # Sistema de gestión de costos
├── costos.json         # Datos y fórmulas de costos
└── assets/             # Recursos gráficos
    ├── logos y imágenes
    └── recursos visuales
```

## ⚙️ Personalización

### 1. **Logos y Branding**
- Reemplaza los archivos en `./assets/` manteniendo los nombres
- Ajusta colores en `index.html` > sección `:root`

### 2. **Colores Corporativos**
```css
:root {
  --brand: #15FCAF;        /* Verde principal Wind */
  --accent-blue: #3E7BFA;  /* Azul de acento */
  --accent-magenta: #EA21D6; /* Magenta de acento */
  /* ... otros colores */
}
```

### 3. **Datos de Costos**
- Modifica `costos.json` para actualizar precios
- El sistema recalcula automáticamente todas las fórmulas
- Los cambios se reflejan en tiempo real

## 🎮 Uso

### **Navegación**
- **Botones**: Siguiente/Anterior
- **Teclado**: ← →, PageUp/PageDown, Home/End
- **Puntos**: Click directo a cualquier slide

### **Exportación PDF**
1. Ve a la primera slide
2. Haz click en **"Descargar PDF Completo"**
3. Espera la generación (muestra indicador de progreso)
4. Descarga automática del PDF completo

### **Características del PDF**
- ✅ **25 slides completas** en formato PPT
- ✅ **Estilos preservados** (colores, gradientes, layouts)
- ✅ **Alta resolución** (1920x1080)
- ✅ **Nombre automático**: `Propuesta_SAPI_Seguridad_Wind_Consulting.pdf`
- ✅ **Ideal para**: Presentaciones, email, impresión

## 🔧 Requisitos Técnicos

- **Navegador moderno** (Chrome, Firefox, Safari, Edge)
- **Sin servidor requerido** - funciona localmente
- **JavaScript habilitado** para funcionalidades dinámicas
- **Librerías externas**: html2pdf.js (cargada automáticamente)

## 🛠️ Soluciones Implementadas

### ✅ **Errores CORS Completamente Eliminados**
- **Problema**: No se podía cargar `costos.json` desde archivos locales
- **Solución**: Bloqueo temporal de fetch durante generación de PDF
- **Resultado**: Sin errores CORS, funciona perfectamente offline

### ✅ **Errores de Canvas Tainted Totalmente Solucionados**
- **Problema**: Imágenes externas causaban errores de exportación
- **Solución**: Reemplazo completo de imágenes y fondos problemáticos
- **Resultado**: Generación de PDF sin errores de seguridad

### ✅ **Manejo Seguro del DOM y Recursos**
- **Problema**: Errores al limpiar elementos del DOM
- **Solución**: Verificación exhaustiva y restauración de funciones originales
- **Resultado**: Limpieza segura sin errores de JavaScript

### ✅ **Configuración Optimizada de html2canvas**
```javascript
html2canvas: {
  scale: 1,                    // ✅ Menos procesamiento
  useCORS: false,             // ✅ Sin problemas CORS
  allowTaint: false,          // ✅ Sin canvas tainted
  foreignObjectRendering: false, // ✅ Evita problemas SVG
  imageTimeout: 0,            // ✅ Sin timeouts
  logging: false              // ✅ Sin ruido en consola
}
```

## 📈 Funcionalidades Avanzadas

- **Cálculos automáticos**: CPL, ROI, ROAS, conversiones
- **Actualización dinámica**: Cambios en JSON se reflejan inmediatamente
- **Responsive design**: Se adapta a cualquier pantalla
- **Accesibilidad**: Navegación por teclado completa
- **Performance**: Optimizado para carga rápida

## 🔧 Troubleshooting

### **Si el PDF no se genera:**
1. **Verifica la consola** del navegador (F12)
2. **Asegúrate de que** la librería html2pdf.js esté cargada
3. **Comprueba que** no hay errores CORS en la consola
4. **Intenta** recargar la página y volver a intentar

### **Si aparecen errores CORS:**
- ✅ **Ya solucionado** - El sistema bloquea costos.json durante PDF
- ✅ **Funciona offline** - No requiere conexión a internet
- ✅ **Archivos locales** - Compatible con file:// protocol

### **Si hay errores de canvas:**
- ✅ **Ya solucionado** - Imágenes reemplazadas con placeholders
- ✅ **Configuración segura** - html2canvas optimizado
- ✅ **Sin imágenes externas** - Evita problemas de seguridad

### **Para debugging:**
```javascript
// En la consola del navegador:
testPDFGeneration(); // Prueba la función de PDF
```

## 📞 Contacto

**Roddy Bonilla** - Director de Proyectos
- Email: roddy.bonilla@windconsul.com
- Teléfono: +52 56 1019 029

---

*Desarrollado con ❤️ por Wind Consulting para SAPI Seguridad*
