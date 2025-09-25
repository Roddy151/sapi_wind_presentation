// Sistema de gestión de costos para la propuesta comercial
class CostosManager {
  constructor() {
    this.data = null;
    this.loaded = false;
    this.autoRefreshInterval = null;
    this.lastDataSignature = null;
    this.refreshIntervalMs = 5000;
    this.remoteRefreshInProgress = false;
    this.fileHandle = null;
  }

  // Cargar datos del JSON
  async cargarDatos() {
    try {
      const cacheKey = (typeof window !== 'undefined' && window.COSTOS_DATA_VERSION)
        ? window.COSTOS_DATA_VERSION
        : Date.now();
      const response = await fetch(`costos.json?v=${cacheKey}`, { cache: 'no-store' });
      const rawData = await response.json();
      const firmaOriginal = this.obtenerDataSignature(rawData);
      this.data = rawData;
      this.recalcularDerivados();
      this.lastDataSignature = firmaOriginal;
      this.loaded = true;
      console.log('Datos de costos cargados correctamente');
      return true;
    } catch (error) {
      console.error('Error al cargar datos de costos:', error);
      console.info('Sugerencia: sirve el proyecto con http://localhost o ejecuta Costos.seleccionarArchivoManual() después de una interacción de usuario.');
      return false;
    }
  }

  actualizarElementosConDatos() {
    if (!this.loaded) return;

    const elementos = document.querySelectorAll('[data-costo-slide][data-costo-campo]');

    console.debug(`[Costos] Refrescando ${elementos.length} elementos en pantalla`);
    elementos.forEach(elemento => {
      const slideId = elemento.getAttribute('data-costo-slide');
      const campo = elemento.getAttribute('data-costo-campo');
      const tipo = elemento.getAttribute('data-costo-tipo') || 'texto';

      this.actualizarElemento(elemento, slideId, campo, tipo);
    });
  }

  iniciarAutoRefresh() {
    if (typeof window === 'undefined') return;
    if (this.autoRefreshInterval) return;

    const enabled = window.COSTOS_AUTO_REFRESH_ENABLED;
    if (enabled === false) return;

    const intervaloConfigurado = Number(window.COSTOS_AUTO_REFRESH_INTERVAL);
    if (!Number.isNaN(intervaloConfigurado) && intervaloConfigurado >= 1000) {
      this.refreshIntervalMs = intervaloConfigurado;
    }

    console.info(`[Costos] Auto-refresh activado cada ${this.refreshIntervalMs / 1000}s`);
    this.autoRefreshInterval = window.setInterval(() => {
      this.verificarActualizacionesRemotas();
    }, this.refreshIntervalMs);

    // Ejecutar una verificación inicial en segundo plano para reflejar cambios recientes
    window.setTimeout(() => {
      this.verificarActualizacionesRemotas();
    }, 1000);
  }

  async verificarActualizacionesRemotas() {
    if (!this.loaded || this.remoteRefreshInProgress) return;

    this.remoteRefreshInProgress = true;
    try {
      console.debug('[Costos] Verificando cambios en costos.json...');
      const response = await fetch(`costos.json?v=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const nuevaData = await response.json();
      const nuevaFirma = this.obtenerDataSignature(nuevaData);

      if (nuevaFirma && nuevaFirma !== this.lastDataSignature) {
        this.data = nuevaData;
        this.recalcularDerivados();
        this.lastDataSignature = nuevaFirma;
        this.actualizarElementosConDatos();
        console.info('[Costos] Datos actualizados por cambio en costos.json');
        const slide19 = this.data?.slides?.slide19;
        if (slide19) {
          console.debug('[Costos] Nuevos valores slide19:', {
            contenidoMensual: slide19.servicios?.contenidoRRSS?.costoMensual,
            gestionMensual: slide19.servicios?.gestionAds?.costoMensual,
            inversionMensual: slide19.totales?.inversionMensual,
            primeraInversion: slide19.totales?.primeraInversion
          });
        }
      }
    } catch (error) {
      console.warn('No se pudo refrescar costos.json automáticamente:', error);

      if (this.fileHandle) {
        const dataFallback = await this.cargarDatosDesdeFileSystem();
        if (dataFallback) {
          const nuevaFirma = this.obtenerDataSignature(dataFallback);
          if (nuevaFirma && nuevaFirma !== this.lastDataSignature) {
            this.data = dataFallback;
            this.recalcularDerivados();
            this.lastDataSignature = nuevaFirma;
            this.actualizarElementosConDatos();
            console.info('[Costos] Datos actualizados desde el sistema de archivos');
          }
        }
      }
    } finally {
      this.remoteRefreshInProgress = false;
    }
  }

  // Obtener valor formateado con moneda
  formatearMonto(monto, opciones = {}) {
    const config = this.data?.configuracion || { formato: { separadorMiles: ',', simboloMoneda: '$' } };
    const { separadorMiles, simboloMoneda } = config.formato;

    if (typeof monto === 'number') {
      return `${simboloMoneda}${monto.toLocaleString('es-MX', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })}`;
    }
    return monto;
  }

  toNumber(valor) {
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string') {
      const normalizado = valor.replace(/[^0-9.,-]/g, '').replace(/,/g, '');
      const numero = Number(normalizado);
      return Number.isNaN(numero) ? 0 : numero;
    }
    return 0;
  }

  formatearNumero(valor) {
    if (typeof valor === 'number') {
      return valor.toLocaleString('es-MX', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    }

    if (typeof valor === 'string') {
      const numero = Number(valor);
      if (!Number.isNaN(numero)) {
        return numero.toLocaleString('es-MX', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        });
      }
    }

    return valor;
  }

  formatearPorcentaje(valor) {
    const formatear = (numero) => {
      const hasDecimals = Math.abs(numero) % 1 !== 0;
      return `${numero.toLocaleString('es-MX', {
        minimumFractionDigits: hasDecimals ? 1 : 0,
        maximumFractionDigits: 2
      })}%`;
    };

    if (typeof valor === 'number') {
      return formatear(valor);
    }

    if (typeof valor === 'string') {
      const trimmed = valor.trim();
      if (trimmed.endsWith('%')) {
        return trimmed;
      }

      const numero = Number(trimmed);
      if (!Number.isNaN(numero)) {
        return formatear(numero);
      }

      return trimmed;
    }

    return valor;
  }

  obtenerDataSignature(data) {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.warn('No se pudo generar la firma de los datos de costos:', error);
      return null;
    }
  }

  puedeUsarFileSystemAccess() {
    return typeof window !== 'undefined' && typeof window.showOpenFilePicker === 'function';
  }

  async cargarDatosDesdeFileSystem(forzarSeleccion = false) {
    if (!this.puedeUsarFileSystemAccess()) return null;

    try {
      if (!this.fileHandle || forzarSeleccion) {
        const [handle] = await window.showOpenFilePicker({
          multiple: false,
          types: [
            {
              description: 'Archivo de costos JSON',
              accept: {
                'application/json': ['.json']
              }
            }
          ]
        });
        this.fileHandle = handle;
      }

      if (!this.fileHandle) return null;

      const file = await this.fileHandle.getFile();
      const text = await file.text();
      return JSON.parse(text);
    } catch (error) {
      console.warn('No se pudo leer costos.json desde el sistema de archivos:', error);
      if (forzarSeleccion) {
        alert('No se pudo cargar costos.json. Verifica el archivo y vuelve a intentarlo.');
      }
      return null;
    }
  }

  recalcularDerivados() {
    if (!this.data?.slides) return;

    const { slides } = this.data;

    // Recalcular métricas del slide 14 a partir de la distribución
    const slide14 = slides.slide14;
    if (slide14?.distribucion) {
      const canales = Object.values(slide14.distribucion);

      const totalInversion = canales.reduce((acum, canal) => acum + this.toNumber(canal.inversion), 0);
      const totalLeads = canales.reduce((acum, canal) => acum + this.toNumber(canal.leads), 0);

      slide14.inversionTotalMensual = totalInversion;
      slide14.leadsEsperados = totalLeads;
      slide14.costoPorLead = totalLeads > 0 ? Number((totalInversion / totalLeads).toFixed(2)) : 0;

      canales.forEach(canal => {
        const leads = this.toNumber(canal.leads);
        const inversion = this.toNumber(canal.inversion);
        if (leads > 0) {
          canal.cpl = Number((inversion / leads).toFixed(2));
        }
      });
    }

    // Recalcular totales del slide 19 a partir de los servicios base
    const slide19 = slides.slide19;
    if (slide19?.servicios) {
      const servicios = slide19.servicios;
      const contenido = servicios.contenidoRRSS || {};
      const creacion = servicios.creacionAds || {};
      const gestion = servicios.gestionAds || {};

      const costoInicioContenido = this.toNumber(contenido.costoInicio);
      const costoMensualContenido = this.toNumber(contenido.costoMensual);
      const costoInicioCreacion = this.toNumber(creacion.costoInicio);
      const costoSetupGestion = this.toNumber(gestion.costoSetup);
      const costoMensualGestion = this.toNumber(gestion.costoMensual);

      const inversionInicial = costoInicioContenido + costoInicioCreacion + costoSetupGestion;
      const inversionMensual = costoMensualContenido + costoMensualGestion;

      // Inversión de medios se basa en el slide 14 por defecto
      const inversionMedios = slides.slide14?.inversionTotalMensual ?? this.toNumber(slide19.totales?.inversionMedios);
      const primeraInversion = inversionMensual + inversionMedios;

      slide19.totales = {
        ...slide19.totales,
        inversionInicial,
        inversionMensual,
        inversionMedios,
        primeraInversion
      };
    }
  }

  // Obtener datos de una slide específica
  getSlideData(slideId) {
    return this.data?.slides?.[slideId] || null;
  }

  // Obtener métrica específica de una slide
  getMetrica(slideId, metrica) {
    const slide = this.getSlideData(slideId);
    return slide?.metricas?.[metrica] || null;
  }

  // Obtener servicio específico
  getServicio(slideId, servicio) {
    const slide = this.getSlideData(slideId);
    return slide?.servicios?.[servicio] || null;
  }

  // Calcular fórmula específica
  calcularFormula(formulaId, parametros = {}) {
    const formula = this.data?.formulas?.[formulaId];
    if (!formula) return null;

    // Aquí se implementarían las fórmulas específicas
    // Por simplicidad, retornamos valores precalculados
    switch (formulaId) {
      case 'slide14':
        const slide14 = this.data.slides.slide14;
        return {
          costoPorLead: slide14.inversionTotalMensual / slide14.leadsEsperados,
          totalInversion: slide14.inversionTotalMensual,
          // Cálculos para Facebook
          facebookCPL: slide14.distribucion.facebook.inversion / slide14.distribucion.facebook.leads,
          // Cálculos para Instagram
          instagramCPL: slide14.distribucion.instagram.inversion / slide14.distribucion.instagram.leads
        };
      case 'slide19':
        return {
          inversionMensual: this.data.slides.slide19.totales.inversionMensual,
          primeraInversion: this.data.slides.slide19.totales.primeraInversion,
          comisionAds: this.data.slides.slide19.totales.inversionMedios * this.data.slides.slide19.servicios.gestionAds.comision
        };
      default:
        return null;
    }
  }

  // Actualizar elemento HTML con datos de costos
  actualizarElemento(destino, slideId, campo, tipo = 'texto') {
    if (!this.loaded) {
      console.warn('Datos de costos no cargados');
      return;
    }

    let elemento = null;
    if (typeof destino === 'string') {
      if (!destino) return;
      elemento = document.getElementById(destino);
    } else if (destino && typeof destino === 'object' && destino.nodeType === 1) {
      elemento = destino;
    }

    if (!elemento) return;

    let valor = null;

    // Buscar el valor en la estructura de datos
    if (campo.includes('.')) {
      const partes = campo.split('.');
      let data = this.getSlideData(slideId);

      for (const parte of partes) {
        if (data && data[parte]) {
          data = data[parte];
        } else {
          data = null;
          break;
        }
      }
      valor = data;
    } else {
      valor = this.getSlideData(slideId)?.[campo];
    }

    if (valor !== null && valor !== undefined) {
      if (tipo === 'monto') {
        elemento.textContent = this.formatearMonto(valor);
      } else if (tipo === 'numero') {
        elemento.textContent = this.formatearNumero(valor);
      } else if (tipo === 'porcentaje') {
        elemento.textContent = this.formatearPorcentaje(valor);
      } else {
        elemento.textContent = valor;
      }
    }
  }

  // Actualizar múltiples elementos de una slide
  actualizarSlide(slideId, mapeos) {
    if (!this.loaded) return;

    mapeos.forEach(mapeo => {
      this.actualizarElemento(mapeo.elemento, slideId, mapeo.campo, mapeo.tipo);
    });
  }

  // Inicializar el sistema
  async inicializar() {
    const cargado = await this.cargarDatos();
    if (cargado) {
      this.configurarActualizacionesAutomaticas();
      this.iniciarAutoRefresh();
    }
    return cargado;
  }

  // Configurar actualizaciones automáticas para elementos con data attributes
  configurarActualizacionesAutomaticas() {
    this.actualizarElementosConDatos();
  }
}

// Funciones de utilidad globales
const Costos = {
  manager: new CostosManager(),

  // Inicializar
  async inicializar() {
    return await this.manager.inicializar();
  },

  async refrescar() {
    if (!this.manager.loaded) {
      console.warn('[Costos] No hay datos cargados todavía. Ejecuta Costos.inicializar() primero.');
      return;
    }
    await this.manager.verificarActualizacionesRemotas();
  },

  async seleccionarArchivoManual() {
    if (!this.manager.puedeUsarFileSystemAccess()) {
      console.warn('[Costos] El navegador no soporta File System Access API en este contexto.');
      return false;
    }

    const data = await this.manager.cargarDatosDesdeFileSystem(true);
    if (!data) {
      console.warn('[Costos] No se seleccionó ningún archivo de costos.');
      return false;
    }

    this.manager.data = data;
    this.manager.recalcularDerivados();
    this.manager.lastDataSignature = this.manager.obtenerDataSignature(data);
    this.manager.loaded = true;
    this.manager.configurarActualizacionesAutomaticas();
    this.manager.iniciarAutoRefresh();
    console.info('[Costos] Datos de costos cargados manualmente');
    return true;
  },

  // Obtener datos formateados
  get(slideId, campo, tipo = 'texto') {
    const valor = this.manager.getSlideData(slideId)?.[campo];
    if (tipo === 'monto' && typeof valor === 'number') {
      return this.manager.formatearMonto(valor);
    }
    return valor;
  },

  // Actualizar elemento específico
  actualizar(elementoId, slideId, campo, tipo = 'texto') {
    this.manager.actualizarElemento(elementoId, slideId, campo, tipo);
  },

  // Actualizar toda una slide
  actualizarSlide(slideId, mapeos) {
    this.manager.actualizarSlide(slideId, mapeos);
  }
};

// Inicializar automáticamente cuando se carga la página
document.addEventListener('DOMContentLoaded', async () => {
  await Costos.inicializar();
  window.Costos = Costos;
});
