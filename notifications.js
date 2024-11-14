// Notification controller for the turnero system
export class NotificationController {
    static showMegaTicket(turno, caja = null, isComplete = false) {
        const megaTicket = document.createElement('div');
        megaTicket.className = `mega-ticket ${isComplete ? 'complete' : ''}`;
        
        const message = isComplete 
            ? `
                <h1>Atención Finalizada</h1>
                <p>Turno ${turno.numero}</p>
                <p>Caja ${caja.id}</p>
            `
            : `
                <h1>${turno.numero}</h1>
                <p>${caja ? `Diríjase a Caja ${caja.id}` : `Espere en Cola ${turno.tipo.toUpperCase()}`}</p>
            `;

        megaTicket.innerHTML = message;
        document.body.appendChild(megaTicket);
        
        setTimeout(() => {
            document.body.removeChild(megaTicket);
        }, 3000);
    }
}