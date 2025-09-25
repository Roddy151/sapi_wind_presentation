// Sistema de gestión de costos para la propuesta comercial
class CostosManager {
  constructor() {
    this.data = null;
    this.loaded = false;
  }

  // Cargar datos del JSON
  async cargarDatos() {
    try {
      const cacheKey = (typeof window !== 'undefined' && window.COSTOS_DATA_VERSION)
        ? window.COSTOS_DATA_VERSION
        : Date.now();
      const response = await fetch(`costos.json?v=${cacheKey}`, { cache: 'no-store' });
      this.data = await response.json();
      this.sincronizarTotales();
      this.loaded = true;
      console.log('Datos de costos cargados correctamente');
      return true;
    } catch (error) {
      console.error('Error al cargar datos de costos:', error);
      return false;
    }
  }

  sincronizarTotales() {
    const slide19 = this.data?.slides?.slide19;
    if (!slide19) return;

    const servicios = slide19.servicios || {};
    const contenido = servicios.contenidoRRSS || {};
    const creacion = servicios.creacionAds || {};
    const gestion = servicios.gestionAds || {};

    const costoInicioContenido =
      typeof contenido.costoInicio === 'number'
        ? contenido.costoInicio
        : (typeof contenido.costoMensual === 'number' ? contenido.costoMensual : 0);

    const inversionInicial =
      (costoInicioContenido || 0) +
      (typeof creacion.costoInicio === 'number' ? creacion.costoInicio : 0) +
      (typeof gestion.costoSetup === 'number' ? gestion.costoSetup : 0);

    const serviciosMensuales =
      (typeof contenido.costoMensual === 'number' ? contenido.costoMensual : 0) +
      (typeof creacion.costoMensual === 'number' ? creacion.costoMensual : 0) +
      (typeof gestion.costoMensual === 'number' ? gestion.costoMensual : 0);

    const inversionMedios =
      typeof slide19.totales?.inversionMedios === 'number'
        ? slide19.totales.inversionMedios
        : 0;

    const inversionMensual = serviciosMensuales + inversionMedios;
    const primeraInversion = inversionInicial + inversionMensual;

    slide19.totales = {
      ...slide19.totales,
      serviciosMensuales,
      inversionInicial,
      inversionMensual,
      inversionMedios,
      primeraInversion
    };
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
  actualizarElemento(elementoId, slideId, campo, tipo = 'texto') {
    if (!this.loaded) {
      console.warn('Datos de costos no cargados');
      return;
    }

    const elemento = document.getElementById(elementoId);
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

    if (valor !== null) {
      if (tipo === 'monto') {
        elemento.textContent = this.formatearMonto(valor);
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
    }
    return cargado;
  }

  // Configurar actualizaciones automáticas para elementos con data attributes
  configurarActualizacionesAutomaticas() {
    const elementos = document.querySelectorAll('[data-costo-slide][data-costo-campo]');

    elementos.forEach(elemento => {
      const slideId = elemento.getAttribute('data-costo-slide');
      const campo = elemento.getAttribute('data-costo-campo');
      const tipo = elemento.getAttribute('data-costo-tipo') || 'texto';

      this.actualizarElemento(elemento.id, slideId, campo, tipo);
    });
  }
}

// Funciones de utilidad globales
const Costos = {
  manager: new CostosManager(),

  // Inicializar
  async inicializar() {
    return await this.manager.inicializar();
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
});
