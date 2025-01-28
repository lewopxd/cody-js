
function captureLogs(iframeWindow) {

    // Guardar los métodos originales de la consola
    const originalConsoleLog = iframeWindow.console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    // Sobrescribir el método console.log
    iframeWindow.console.log = function (...args) {
        // Llamar al método original - imprimir en consola global
        if (mirrorLogInGlobalConsole) {
            originalConsoleLog.apply(console, args);
        }

        // emitir un evento
        const event = new CustomEvent('customLog', { detail: { type: 'log', args } });
        iframeWindow.dispatchEvent(event);
    };


    
  

    // Escuchar el evento personalizado
    iframeWindow.addEventListener('customLog', (event) => {
        const outputDiv = document.getElementById('console');  // Consola de salida

        // Limpiar la consola antes de mostrar nuevo log
        if (autoClean) { outputDiv.innerHTML = ''; }

        const { type, args } = event.detail;
        //  console.log(`Capturado: ${type}`, args);

        const div = document.createElement('div');
        outputDiv.appendChild(div);
        div.textContent = args;
    });

}