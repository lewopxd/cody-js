
//CONFIGURACIÓN 
const mirrorLogInGlobalConsole = true;  //Mostrar logs en la consola global del navegador ? aun hay un error so hay un error en la consola global se esta mostrando en la del div
const path = ""; //ruta del archivo
const file = "script"; //archivo
const extension = ".js" //extension del archvo
const autoClean = false; // true: limpia la consola antes de mostrar un nuevo log
const mergeReplicated = true;  // merge  log messages with from same ubication and content



//useful vars
let last_Log = { method: "", logLocation: { line: 0, column: 0 }, args: [] };  // localizacion de ultimo mensaje de log
let replicated = { count: 0, token_id: "", use: true };  // registro de logs duplicados  - used:true variable auxiliar
let hasCleaned = false;


// Configuración de CodeMirror
const editor = CodeMirror(document.getElementById('editor'), {
    mode: "javascript",  // Habilita el resaltado de sintaxis para JavaScript
    theme: "dracula",  // Tema de colores
    lineNumbers: true,
    lineWrapping: false,
    height: "100%",
    value: `// @CodyLeo: write js\nconsole.log("¡Hola Mundo!")\nconsole.cody("¡Hello World!");`
});

//  Antes de que la página se muestre completamente.
document.addEventListener("DOMContentLoaded", function () {
    console.log("El DOM está listo pero los recursos (imágenes, CSS) pueden seguir cargando.");

    // Ajustar tamaño explícitamente del editor
      editor.setSize("100%", "100%");

    if (getSavedCode()) {// rescatar el texto del editor guardado en local storage
        editor.setValue(getSavedCode());
    }

    if (getWindowDivisionState()) {    // rescatar el ancho de los contenedores 
        //setWindowDivision(getWindowDivisionState());
    }

    setupButtonListeners();


});



//Button run> 
function runCode() {

    configBar(); // configuracion barra de menu

    const sandBox = iFrame();
    captureLogs(sandBox);  //capturar logs con events
    captureError(sandBox);
    saveCode();
}


//IFRAME - Crear un iframe para ejecutar el código en un entorno aislado
function iFrame() {

    iframeCleaner(); // eliminiar del dom todos los iframes

    const code = editor.getValue(); // Obtiene el código del editor
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    const iframeWindow = iframe.contentWindow;
    iframeDoc.open();

    // Escribir el código en el iframe con un script tipo "module" para soportar importaciones ES6
    iframeDoc.write(`
    <script type="module">
        parent.postMessage('inicia-funcion-sincrona', '*'); // Notificar al principal
        ${code}        
       parent.postMessage('termina-funcion-sincrona', '*'); // Notificar al principal
    </script>
  `);
    iframeDoc.close();

    return iframeWindow;
}

//Capturar los errores generados por compilador  no console.error
function captureError(iframeWindow) {
    iframeWindow.onerror = (message, source, lineno, colno, error) => {
        const outputDiv = document.getElementById('console');  // Consola de salida
        const div = document.createElement('div');
        const where = `(${file}${extension}:${lineno - 2}:${colno})`;
        div.textContent = "▸ " + message + "\n" + where;

        div.className = 'debug-error-message';

        outputDiv.appendChild(div);
        // Desplazar el contenedor hacia el final para que siempre se vea el último div
        outputDiv.scrollTop = outputDiv.scrollHeight;
        return !mirrorLogInGlobalConsole;
    };
}

// Funcion para capturar Log Warn Error Console Events
function captureLogs(iframeWindow) {

    // Sobrescribir la consola dentro del iframe
    const captureConsole = (method) => {

        // Guardar el método original
        const originalMethod = iframeWindow.console[method];

        iframeWindow.console[method] = (...args) => {

            // true = Llamar al método original - imprimir en consola global
            if (mirrorLogInGlobalConsole) {
                if (method === 'cody') {
                    //originalMethod.log(`[CODY]: ${formatArgs(args)}`);
                    console.log(`[CODY]: ${formatArgs(args)}`);
                } else {
                    originalMethod.apply(console, args);
                }

            }

            // Obtener línea y columna
            const logLocation = getLoc();

            // emitir un evento
            const event = new CustomEvent(`custom${method}`, {
                detail: { type: `${method}`, args, logLocation }
            });
            iframeWindow.dispatchEvent(event);

        };

        // Escuchar el evento personalizado
        iframeWindow.addEventListener(`custom${method}`, (event) => {

            const { type, args, logLocation } = event.detail;

            // console.log(`Capturado: ${type}`, args); // Gestionar los logs con línea y columna
            manageLogs({
                method: type,
                logLocation: logLocation,
                args: args
            });

        });
    };

    // Capturar todos los tipos de mensajes de consola sin que se vean en la consola del navegador
    ['log', 'error', 'warn', 'info', 'cody'].forEach(captureConsole);

}



function manageLogs(ev) {

    //crear un token random irrepetible
    const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

    const li = ev.logLocation.line;
    const co = ev.logLocation.column;

    // Crear un nuevo div para cada mensaje y mostrarlo en la consola de la página
    const div = document.createElement('div');

    if (ev.method === 'log') {
        div.className = "log-message";
    } else if (ev.method === 'warn') {
        div.className = "warn-message";
    } else if (ev.method === 'error') {
        div.className = "error-message";
    } else if (ev.method === 'info') {
        div.className = "info-message";
    }
    else if (ev.method === 'cody') {
        div.className = "cody-message";
    }



    // [div    [ innerLeft] [innerDivText] [innerRight]    ] 

    //crear Primer contenedor -izq 
    const innerLeft = document.createElement('div');
    innerLeft.className = 'console-inner-left';

    // Crear un nodo de texto y asignarle un ID
    const leftText = document.createElement('span');
    leftText.className = `console-leftText`; // Asignar un ID al elemento
    leftText.id = `console-leftText-${token}`
    leftText.textContent = ''; // Establecer el contenido del texto

    // Agregar el nodo de texto al contenedor
    innerLeft.appendChild(leftText);
    div.appendChild(innerLeft);


    // Procesar los argumentos y formatearlos
    const formattedArgs = formatArgs(ev.args);


    // Crear el segundo contenedor (texto del log)  
    const innerDivText = document.createElement('div');
    innerDivText.className = 'console-inner-text';
    innerDivText.innerHTML = `▸ ${formattedArgs.replace(/\n/g, '<br>')}`; //formatear espacios de js a html
    div.appendChild(innerDivText);


    // Crear tercer contenedor - derecha
    const innerDivRight = document.createElement('div');
    innerDivRight.className = 'console-inner-right';  // Clase para el estilo
    const link = document.createElement('a');
    link.className = "console-link";
    gotoLine(link, ev);


    //setear el link, a ubicacion del log en editor
    link.href = `#${file}${extension}:${li}:${co}-${token}`; // No redirige a ningún lado

    link.textContent = `[#${file}${extension}:${li}]`; // Texto del enlace
    innerDivRight.appendChild(link);
    div.appendChild(innerDivRight);

    const outputDiv = document.getElementById('console');  // Consola de salida    
    const lt = leftText;

    // what to do with replicated log messages
    if (mergeReplicated) {
        if ((last_Log.logLocation.line === ev.logLocation.line)
            && (last_Log.method === ev.method)
            && (last_Log.logLocation.column === ev.logLocation.column)
            && (formatArgs(last_Log.args) === formatArgs(ev.args))
            && (replicated.use === true)
            && (!hasCleaned)) {

            replicated.count++;


            lt.textContent = `(${replicated.count})`;
            lt.classList.add('numb');

            const elements = document.querySelectorAll('.console-leftText'); // Selecciona todos los elementos con la clase
            const last_lefText = elements[elements.length - 1]; // Obtén el último elemento
            last_lefText.parentNode.replaceChild(lt, last_lefText);

            replicated.token_id = token;


        } else {
            // autoclean = true ->Limpiar la consola antes de mostrar nuevo log
            if (autoClean) { outputDiv.innerHTML = ''; }
            hasCleaned = false;
            outputDiv.appendChild(div);
            replicated.count = 0;
            lt.classList.remove('numb');

            if (replicated.count > 0) {
                replicated.use = false;
            }




        }
        last_Log = ev;

        // 
    }


    // Desplazar el contenedor hacia el final para que siempre se vea el último div
    outputDiv.scrollTop = outputDiv.scrollHeight;

}


//Obtener  Numero de fila y columa del Log 
function getLoc() {
    // Crear un objeto de error para obtener el stack trace
    const error = new Error();
    const stack = error.stack.split('\n');

    // Obtener la línea y columna del stack trace
    const location = stack[3]; // El segundo elemento del stack es donde se llama el método
    const locationRegex = /at\s+(.*):(\d+):(\d+)/;
    const match = location.match(locationRegex);

    let line = null;
    let column = null;

    if (match) {
        line = match[2];  // Línea
        column = match[3];  // Columna
    }

    let li = parseInt(line) - 2;
    let co = parseInt(column) + 3;

    const logLoc = { line: li, column: co };
    return logLoc;
}


//formatear el texto de consola a formato legible
function formatArgs(args) {// Procesar los argumentos y formatearlos
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

    return formattedArgs;
}




// ------------------[   Divición vertical    ]--------------------------------

const container = document.getElementById('container');
const editorx = document.getElementById('editor-container');
const consoleDiv = document.getElementById('console-container');
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
    const minWidth = 10; // Ancho mínimo para editor y consola
    const maxWidth = containerRect.width - minWidth;



    // salvar en memoria la posision de ventana

    if (offsetX > minWidth && offsetX < maxWidth) {
        const editorWidth = (offsetX / containerRect.width) * 100; // Calcular porcentaje
        const consoleWidth = 100 - editorWidth; // Resto del espacio


        saveWindowDivisionState({ editorWidth: editorWidth, consoleWidth: consoleWidth });
        editorx.style.width = `${editorWidth}%`;
        consoleDiv.style.width = `${consoleWidth}%`;

       //editorx.setProperty("width", `${editorWidth}%`, "important");
       // consoleDiv.setProperty("width", `${consoleWidth}%`, "important");
    }
});


// Guardar en almacenamiento local el ancho de los contenedores principales
function saveWindowDivisionState(windowDivisionWidth) {
    localStorage.setItem('windowDivisionWidth', JSON.stringify(windowDivisionWidth));

}
// Rescatar de almacenamiento local el ancho de los contenedores
function getWindowDivisionState() {
    // Recuperar datos de Local Storage
    const data = JSON.parse(localStorage.getItem('windowDivisionWidth'));

    if (data) {
        return data;
    } else {
        return null;
    }
}
// Reestablecer el ancho de los contenedores 
function setWindowDivision(windowDivisionWidth) {
    const editorx = document.getElementById('editor');
    const consoleDiv = document.getElementById('console-container');

    editorx.style.width = `${windowDivisionWidth.editorWidth}%`;
    consoleDiv.style.width = `${windowDivisionWidth.consoleWidth}%`;
}


//------ Mover el boton con el divisor
function alignRunBtn() {
    const divisorRect = divisor.getBoundingClientRect();
    const btnRect = runBtn.getBoundingClientRect(); // Obtener el tamaño y posición del botón

    // Calcular el centro del divisor
    const centerX = divisorRect.left + (divisorRect.width / 2);

    // Obtener el ancho del botón
    const buttonWidth = btnRect.width; // Ancho del botón en píxeles

    // Calcular el desplazamiento del botón para que su centro esté alineado con el centro del divisor
    const btnOffsetX = centerX

    // Actualizar la posición del botón
    runBtn.style.position = 'absolute';
    runBtn.style.left = `${btnOffsetX}px`;
}

// Llamar a la función en cada movimiento del divisor
document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        alignRunBtn(); // Actualizar la posición del botón
    }
});

// Asegurarse de que el botón esté alineado al cargar la página
window.addEventListener('load', alignRunBtn);
window.addEventListener('resize', alignRunBtn);



///--- funcion para ir a la linea del log en el editor 

function gotoLine(linkElement, ev) {
    if (!linkElement) {
        console.error('El enlace no tiene un ID válido.');
        return;
    }

    // Agregar un listener de clic
    linkElement.addEventListener('click', (e) => {
        e.preventDefault();

        const li = (ev.logLocation.line) - 1;
        const co = ev.logLocation.column;
        console.log('Se ha hecho clic en ', li + "-- " + co);

        editor.setCursor({ line: li, ch: co });
        editor.setSelection({ line: li, ch: 0 }, { line: li, ch: co });  // Resalta una sola columna

        // agregar cualquier otra lógica para navegar, si es necesario
    });
}


//Guardar 5MB de codigo localmente
function saveCode() {
    // Guardar datos en Local Storage
    const code = editor.getValue(); // Obtiene el código del editor
    localStorage.setItem('code', code);

}

//oobtenr codigo guardado en local
function getSavedCode() {
    // Recuperar datos de Local Storage
    const data = localStorage.getItem('code');

    if (data) {
        return data;
    } else {
        return null;
    }

}

/// eliminar toods los iframes antes de crear uno nuevo

function iframeCleaner() {
    try {
        document.querySelectorAll('iframe').forEach(iframe => iframe.remove());
    } catch {

    }

}



//-------------------Buttons Listeneres
function setupButtonListeners() {
    document.querySelectorAll("button").forEach(button => {
        button.addEventListener("click", function () {
            const buttonId = this.id;

            switch (buttonId) {
                case "runBtn":
                    runCode();
                    break;
                case "console-bar-button-trash":
                    const outputDiv = document.getElementById('console');
                    outputDiv.innerHTML = "";
                    replicated.count = 0;
                    replicated.use = true;
                    hasCleaned = true;
                    break;
                case "btn-edit":
                    console.log("Editar acción ejecutada");
                    break;
                default:
                    console.log(`Botón con ID "${buttonId}" clickeado`);
                    break;
            }
        });
    });
}

// Llamar a la función para activar los listeners
setupButtonListeners();




//---------------------Window---
function configBar() {
    console.log("bar");
}


console.log("#CodyLeo by @lewop");


