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
      this.loaded = true;
      console.log('Datos de costos cargados correctamente');
      return true;
    } catch (error) {
      console.error('Error al cargar datos de costos:', error);
      return false;
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

      this.actualizarElemento(elemento, slideId, campo, tipo);
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
