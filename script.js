
//CONFIGURACIÓN 
const mirrorLogInGlobalConsole = false;  //Mostrar logs en la consola global del navegador ? aun hay un error so hay un error en la consola global se esta mostrando en la del div
const path = ""; //ruta del archivo
const file = "script"; //archivo
const extension = ".js" //extension del archvo
const autoClean = true; // true: limpia la consola antes de mostrar un nuevo log



// Configuración de CodeMirror
const editor = CodeMirror(document.getElementById('editor'), {
    mode: "javascript",  // Habilita el resaltado de sintaxis para JavaScript
    theme: "dracula",  // Tema de colores
    lineNumbers: true,
    lineWrapping: false,
    height: "100%",
    value: `// type js\nconsole.log("¡Hola Mundo!");`
});

// Ajustar tamaño explícitamente del editor
editor.setSize("100%", "100%");


//Función principal para mostrar logs 

function runCode() {
    const code = editor.getValue(); // Obtiene el código del editor
    const outputDiv = document.getElementById('console');  // Consola de salida

    // Limpiar la consola antes de mostrar nuevo log
    if(autoClean){
    outputDiv.innerHTML = '';
    }

    // Crear un iframe para ejecutar el código en un entorno aislado
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    const iframeWindow = iframe.contentWindow;
    iframeDoc.open();


    iframe.contentWindow.onerror = (message, source, lineno, colno, error) => {
        // Cada vez que el iframe llama a console.log, lo agregamos al div de la consola
        const div = document.createElement('div');
        const where = `(${file}${extension}:${lineno - 2}:${colno})`;
        div.textContent = "▸ " + message + "\n" + where;

        div.className = 'error-message';

        outputDiv.appendChild(div);
        // Desplazar el contenedor hacia el final para que siempre se vea el último div
        outputDiv.scrollTop = outputDiv.scrollHeight;
        return !mirrorLogInGlobalConsole;
    };


    // Sobrescribir la consola dentro del iframe
    const captureConsole = (method) => {
        // Guardar el método original
        const originalMethod = iframeWindow.console[method];
        iframeWindow.console[method] = (...args) => {
            // Crear un nuevo div para cada mensaje y mostrarlo en la consola de la página
            const div = document.createElement('div');

            // Crear un objeto de error para obtener el stack trace
            const error = new Error();
            const stack = error.stack.split('\n');

            // Obtener la línea y columna del stack trace
            const location = stack[2]; // El segundo elemento del stack es donde se llama el método
            const locationRegex = /at\s+(.*):(\d+):(\d+)/;
            const match = location.match(locationRegex);

            let line = null;
            let column = null;

            if (match) {
                line = match[2];  // Línea
                column = match[3];  // Columna
            }

            let li = parseInt(line) - 2;
            let co = parseInt(column) + 4;
           // console.log(li + ":" + co);

            editor.setCursor(li - 1, co);  // Línea 5, Columna 10 (se cuentan desde 0)


            if (method === 'log') {
                div.className = "log-message";
            } else if (method === 'warn') {
                div.className = "warn-message";
            } else if (method === 'error') {
                div.className = "error-message";
            }


            outputDiv.appendChild(div);

            const innerLeft = document.createElement('div');
            innerLeft.className = 'console-inner-left';  // Clase para el estilo     
            innerLeft.innerHTML = `▸`;        
            div.appendChild(innerLeft);


            //formatear el texto de consola a formato legible

            // Procesar los argumentos y formatearlos
            const formattedArgs = args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2); // Formatear el objeto como JSON
                    } catch (e) {
                        return '[Circular]'; // Manejar referencias circulares
                    }
                }
                return arg; // Para datos simples como strings, números, etc.
            }).join(' ');



            //▶ ▸ ▼ 
            // Crear el segundo div dentro del primero, alineado a la derecha
            const innerDivText = document.createElement('div');
            innerDivText.className = 'console-inner-text';  // Clase para el estilo
            //  innerDivText.textContent = `▸ ${args.join(' ')}`;  // Unir los argumentos de consola
            innerDivText.innerHTML = `${formattedArgs.replace(/\n/g, '<br>')}`;

            div.appendChild(innerDivText);

            const innerDivRight = document.createElement('div');
            innerDivRight.className = 'console-inner-right';  // Clase para el estilo
            const link = document.createElement('a');
            link.className = "console-link";
            const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

            link.href = `#${file}${extension}:${li}:${co}-${token}`; // No redirige a ningún lado

            link.textContent = `[#${file}${extension}:${li}]`; // Texto del enlace
            innerDivRight.appendChild(link);
            div.appendChild(innerDivRight);

            // Desplazar el contenedor hacia el final para que siempre se vea el último div
            outputDiv.scrollTop = outputDiv.scrollHeight;
            //  llamar a la consola del navegador
            if (mirrorLogInGlobalConsole) {
                return originalMethod.apply(iframeWindow.console, args);
            }
        };
    };

    // Capturar todos los tipos de mensajes de consola sin que se vean en la consola del navegador
    ['log', 'error', 'warn', 'info'].forEach(captureConsole);

    // Escribir el código en el iframe con un script tipo "module" para soportar importaciones ES6
    iframeDoc.write(`
      <script type="module">
         
          ${code}
         
      </script>
    `);
    iframeDoc.close();
}

console.log("@Cody");


// Asignar la acción de clic en el botón de ejecución
document.getElementById('runBtn').addEventListener('click', runCode);




const container = document.getElementById('container');
const editorx = document.getElementById('editor');
const consoleDiv = document.getElementById('console');
const divisor = document.getElementById('divisor-vertical');

let isDragging = false;

// Manejador para iniciar el arrastre
divisor.addEventListener('mousedown', (e) => {
    isDragging = true;
    document.body.style.cursor = 'col-resize'; // Cambiar cursor
});

// Manejador para terminar el arrastre
document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.cursor = 'default'; // Restaurar cursor
});

// Manejador para el movimiento del ratón
document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const containerRect = container.getBoundingClientRect();
    const offsetX = e.clientX - containerRect.left; // Posición del cursor dentro del contenedor

    // Evitar que el editor o consola sean demasiado pequeños
    const minWidth = 50; // Ancho mínimo para editor y consola
    const maxWidth = containerRect.width - minWidth;

    if (offsetX > minWidth && offsetX < maxWidth) {
        const editorWidth = (offsetX / containerRect.width) * 100; // Calcular porcentaje
        const consoleWidth = 100 - editorWidth; // Resto del espacio

        editorx.style.width = `${editorWidth}%`;
        consoleDiv.style.width = `${consoleWidth}%`;
    }
});
