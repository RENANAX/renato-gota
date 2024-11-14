class TurnoSystem {
    constructor() {
        this.loadState();
        this.init();
    }

    loadState() {
        const savedState = localStorage.getItem('turnoSystemState');
        if (savedState) {
            const state = JSON.parse(savedState);
            this.cajas = state.cajas || this.getDefaultCajas();
            this.colaVIP = state.colaVIP || [];
            this.colaNormal = state.colaNormal || [];
            this.contadorVIP = state.contadorVIP || 1;
            this.contadorNormal = state.contadorNormal || 1;
            this.historialAtenciones = state.historialAtenciones || [];
        } else {
            this.cajas = this.getDefaultCajas();
            this.colaVIP = [];
            this.colaNormal = [];
            this.contadorVIP = 1;
            this.contadorNormal = 1;
            this.historialAtenciones = [];
        }
    }

    getDefaultCajas() {
        return [
            { id: 1, tipo: 'vip', ocupada: false, clienteActual: null },
            { id: 2, tipo: 'vip', ocupada: false, clienteActual: null },
            { id: 3, tipo: 'normal', ocupada: false, clienteActual: null },
            { id: 4, tipo: 'normal', ocupada: false, clienteActual: null },
            { id: 5, tipo: 'normal', ocupada: false, clienteActual: null }
        ];
    }

    saveState() {
        const state = {
            cajas: this.cajas,
            colaVIP: this.colaVIP,
            colaNormal: this.colaNormal,
            contadorVIP: this.contadorVIP,
            contadorNormal: this.contadorNormal,
            historialAtenciones: this.historialAtenciones
        };
        localStorage.setItem('turnoSystemState', JSON.stringify(state));
    }

    init() {
        this.inicializarCajas();
        this.actualizarColas();
        this.actualizarHistorial();
        setInterval(() => {
            this.actualizarColas();
            this.saveState();
        }, 5000);
    }

    inicializarCajas() {
        const cajasContainer = document.getElementById('cajas');
        if (!cajasContainer) return;

        cajasContainer.innerHTML = this.cajas.map(caja => `
            <div id="caja-${caja.id}" class="caja ${caja.tipo} ${caja.ocupada ? 'ocupada' : ''}">
                <h3>Caja ${caja.id} (${caja.tipo.toUpperCase()})</h3>
                <p id="estado-caja-${caja.id}">${caja.ocupada ? 'Ocupada' : 'Disponible'}</p>
                ${caja.clienteActual ? `
                    <p class="cliente-actual">Atendiendo: ${caja.clienteActual.numero}</p>
                ` : ''}
                <button onclick="window.turnoSystem.atenderSiguiente(${caja.id})" ${!caja.ocupada && (this.colaVIP.length === 0 && this.colaNormal.length === 0) ? 'disabled' : ''}>
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
        this.saveState();
    }

    mostrarTicketAnimado(turno, caja = null) {
        const ticketDiv = document.createElement('div');
        ticketDiv.className = 'mega-ticket ticket-animation';
        
        ticketDiv.innerHTML = `
            <h1>${turno.numero}</h1>
            <p>${caja ? `Diríjase a Caja ${caja.id}` : `Espere en Cola ${turno.tipo.toUpperCase()}`}</p>
        `;
        
        document.body.appendChild(ticketDiv);
        
        setTimeout(() => {
            document.body.removeChild(ticketDiv);
        }, 3000);
    }

    generarTurnoCliente(tipo) {
        const turno = this.generarTurno(tipo);
        const currentNumber = document.getElementById('currentNumber');
        
        if (currentNumber) {
            currentNumber.textContent = turno.numero;
            currentNumber.style.animation = 'none';
            currentNumber.offsetHeight; // Trigger reflow
            currentNumber.style.animation = 'ticketPulse 0.5s ease-out';
        }
        
        return turno;
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
            this.mostrarTicketAnimado(turno, cajaDisponible);
        } else {
            if (tipo === 'vip') {
                this.colaVIP.push(turno);
            } else {
                this.colaNormal.push(turno);
            }
            this.mostrarTicketAnimado(turno);
        }
        
        this.actualizarColas();
        this.inicializarCajas();
        this.saveState();
        return turno;
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
            this.mostrarTicketAnimado(siguienteCliente, caja);
        }

        this.actualizarColas();
        this.inicializarCajas();
        this.saveState();
    }

    calcularTiempoEspera(tiempo) {
        const ahora = new Date();
        const espera = Math.floor((ahora - new Date(tiempo)) / 60000);
        return espera === 0 ? 'Menos de 1 minuto' : `${espera} minuto${espera === 1 ? '' : 's'}`;
    }

    actualizarColas() {
        const colaVipElement = document.getElementById('cola-vip');
        const colaNormalElement = document.getElementById('cola-normal');

        if (colaVipElement) {
            colaVipElement.innerHTML = this.colaVIP
                .map(cliente => `
                    <div class="cliente cliente-vip">
                        <span>${cliente.numero}</span>
                        <span class="tiempo-espera">Espera: ${this.calcularTiempoEspera(cliente.tiempo)}</span>
                    </div>
                `).join('');
        }
        
        if (colaNormalElement) {
            colaNormalElement.innerHTML = this.colaNormal
                .map(cliente => `
                    <div class="cliente">
                        <span>${cliente.numero}</span>
                        <span class="tiempo-espera">Espera: ${this.calcularTiempoEspera(cliente.tiempo)}</span>
                    </div>
                `).join('');
        }
    }

    actualizarHistorial() {
        const historialDiv = document.getElementById('historial');
        if (!historialDiv) return;

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

    getCajas() {
        return this.cajas;
    }
}