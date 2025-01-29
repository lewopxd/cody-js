// functions needed before dom loaded

 
//añadir al css el ancho de los contenedores si existe en local storage

/*
(function () {

    const storedDivisionWidth = JSON.parse(localStorage.getItem('windowDivisionWidth'))
    
 console.log("preload editor:" +storedDivisionWidth.editorWidth);
 console.log("preload console:" +storedDivisionWidth.consoleWidth);

    if (storedDivisionWidth.editorWidth && storedDivisionWidth.consoleWidth) {

        console.log("preload ok");
        let style = document.createElement("style");

        const editorStyle = `#editor-container { width: ${storedDivisionWidth.editorWidth}% !important; }`;
        const consoleStyle = `#console-container { width: ${storedDivisionWidth.consoleWidth}% !important; }`;
       
        
        style.innerHTML =  editorStyle +"\n"+consoleStyle;
        document.head.appendChild(style);
    }
})();

*/
 

function appendDynamicStyles() {
  //  const storedDivisionWidth = JSON.parse(localStorage.getItem('windowDivisionWidth'));

    const storedDivisionWidth = JSON.parse(localStorage.getItem("windowDivisionWidth")) || { editorWidth: 49.95, consoleWidth: 49.95 };

    const editorStyle = `#editor-container { width: ${storedDivisionWidth.editorWidth}% !important; }`;
    const consoleStyle = `#console-container { width: ${storedDivisionWidth.consoleWidth}% !important; }`;

    let sheets = document.styleSheets;

    for (let sheet of sheets) {
        try {
            sheet.insertRule(editorStyle, sheet.cssRules.length);
            sheet.insertRule(consoleStyle, sheet.cssRules.length);

            console.log("estilos modificados");
            return;
        } catch (e) {
            console.warn("No se pudo modificar la hoja de estilos:", e);
        }
    }
}

// Ejecutar cuando se cargue el script


//appendDynamicStyles();
