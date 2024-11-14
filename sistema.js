// Sistema de Turnos - Main Logic
import { audioController } from './audio.js';
import { NotificationController } from './notifications.js';

class TurnoSystem {
    constructor() {
        this.cajas = [
            { id: 1, tipo: 'vip', ocupada: false, clienteActual: null },
            { id: 2, tipo: 'vip', ocupada: false, clienteActual: null },
            { id: 3, tipo: 'normal', ocupada: false, clienteActual: null },
            { id: 4, tipo: 'normal', ocupada: false, clienteActual: null },
            { id: 5, tipo: 'normal', ocupada: false, clienteActual: null }
        ];

        this.colaVIP = [];
        this.colaNormal = [];
        this.contadorVIP = 1;
        this.contadorNormal = 1;
        this.historialAtenciones = [];

        this.init();
    }

    init() {
        this.inicializarCajas();
        this.actualizarColas();
        this.actualizarHistorial();
        setInterval(() => this.actualizarColas(), 60000);

        // Make methods available globally
        window.turnoSystem = this;
        window.generarTurno = (tipo) => this.generarTurno(tipo);
        window.atenderSiguiente = (cajaId) => this.atenderSiguiente(cajaId);
        window.toggleAudio = () => audioController.toggleMute();

        // Start background music on user interaction
        document.addEventListener('click', () => {
            audioController.playBackgroundMusic();
        }, { once: true });
    }

    inicializarCajas() {
        const cajasContainer = document.getElementById('cajas');
        cajasContainer.innerHTML = this.cajas.map(caja => `
            <div id="caja-${caja.id}" class="caja ${caja.tipo} ${caja.ocupada ? 'ocupada' : ''}">
                <h3>Caja ${caja.id} (${caja.tipo.toUpperCase()})</h3>
                <p id="estado-caja-${caja.id}">${caja.ocupada ? 'Ocupada' : 'Disponible'}</p>
                ${caja.clienteActual ? `
                    <p class="cliente-actual">Atendiendo: ${caja.clienteActual.numero}</p>
                ` : ''}
                <button onclick="turnoSystem.atenderSiguiente(${caja.id})" ${!caja.ocupada && (this.colaVIP.length === 0 && this.colaNormal.length === 0) ? 'disabled' : ''}>
                    ${caja.ocupada ? 'Finalizar Atención' : 'Siguiente Cliente'}
                </button>
            </div>
        `).join('');
    }

    encontrarCajaDisponible(tipoCliente) {
        let caja = this.cajas.find(c => c.tipo === tipoCliente && !c.ocupada);
        
        if (!caja && tipoCliente === 'vip') {
            caja = this.cajas.find(c => !c.ocupada);
        }
        
        if (!caja && tipoCliente === 'normal' && this.colaVIP.length === 0) {
            caja = this.cajas.find(c => c.tipo === 'vip' && !c.ocupada);
        }
        
        return caja;
    }

    asignarClienteACaja(cliente, caja) {
        caja.ocupada = true;
        caja.clienteActual = cliente;
    }

    generarTurno(tipo) {
        const tiempo = new Date();
        const turno = {
            numero: tipo === 'vip' ? `VIP-${this.contadorVIP++}` : `N-${this.contadorNormal++}`,
            tipo: tipo,
            tiempo: tiempo
        };

        const cajaDisponible = this.encontrarCajaDisponible(tipo);
        
        if (cajaDisponible) {
            this.asignarClienteACaja(turno, cajaDisponible);
            NotificationController.showMegaTicket(turno, cajaDisponible);
        } else {
            if (tipo === 'vip') {
                this.colaVIP.push(turno);
            } else {
                this.colaNormal.push(turno);
            }
            NotificationController.showMegaTicket(turno);
        }
        
        audioController.playNewTicketSound();
        this.actualizarColas();
        this.inicializarCajas();
    }

    atenderSiguiente(cajaId) {
        const caja = this.cajas.find(c => c.id === cajaId);
        if (!caja) return;

        if (caja.ocupada) {
            const clienteAtendido = caja.clienteActual;
            
            this.historialAtenciones.push({
                numero: clienteAtendido.numero,
                tipo: clienteAtendido.tipo,
                caja: caja.id,
                tiempoFin: new Date()
            });
            
            NotificationController.showMegaTicket(clienteAtendido, caja, true);
            audioController.playCompleteSound();
            
            this.actualizarHistorial();
            caja.ocupada = false;
            caja.clienteActual = null;
        }

        let siguienteCliente = null;
        
        if (this.colaVIP.length > 0) {
            siguienteCliente = this.colaVIP.shift();
        } 
        else if (this.colaNormal.length > 0) {
            siguienteCliente = this.colaNormal.shift();
        }

        if (siguienteCliente) {
            this.asignarClienteACaja(siguienteCliente, caja);
            NotificationController.showMegaTicket(siguienteCliente, caja);
            audioController.playNewTicketSound();
        }

        this.actualizarColas();
        this.inicializarCajas();
    }

    calcularTiempoEspera(tiempo) {
        const ahora = new Date();
        const espera = Math.floor((ahora - new Date(tiempo)) / 60000);
        return espera === 0 ? 'Menos de 1 minuto' : `${espera} minuto${espera === 1 ? '' : 's'}`;
    }

    actualizarColas() {
        document.getElementById('cola-vip').innerHTML = this.colaVIP
            .map(cliente => `
                <div class="cliente cliente-vip">
                    <span>${cliente.numero}</span>
                    <span class="tiempo-espera">Espera: ${this.calcularTiempoEspera(cliente.tiempo)}</span>
                </div>
            `).join('');
        
        document.getElementById('cola-normal').innerHTML = this.colaNormal
            .map(cliente => `
                <div class="cliente">
                    <span>${cliente.numero}</span>
                    <span class="tiempo-espera">Espera: ${this.calcularTiempoEspera(cliente.tiempo)}</span>
                </div>
            `).join('');
    }

    actualizarHistorial() {
        const historialDiv = document.getElementById('historial');
        historialDiv.innerHTML = this.historialAtenciones
            .slice(-10)
            .reverse()
            .map(atencion => `
                <div class="historial-item ${atencion.tipo}">
                    <span class="ticket-number">${atencion.numero}</span>
                    <span class="caja-number">Caja ${atencion.caja}</span>
                    <span class="tiempo">${new Date(atencion.tiempoFin).toLocaleTimeString()}</span>
                </div>
            `).join('');
    }
}

// Initialize the system when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TurnoSystem();
});