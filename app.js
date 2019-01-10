// Módulos
var express = require('express');
var app = express();

// Librerias para el manejo de la sesion
var expressSession = require('express-session');
app.use(expressSession({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: true
}));
// Modulo apra seguridad
var helmet = require('helmet');
app.use(helmet());
// Modulo para criptografia
var crypto = require('crypto');

// Modulo para la subida de ficheros
var fileUpload = require('express-fileupload');
app.use(fileUpload());
// Conexion con mongodb
var mongo = require('mongodb');
// Motor de plantillas
var swig  = require('swig');

// Dependencia del parseador de texto para el POST
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Objeto de gestion de conexiones con base de datos
var gestorBD = require("./modules/gestorBD.js");
gestorBD.init(app, mongo);

// routerUsuarioSession
var routerUsuarioSession = express.Router();
routerUsuarioSession.use(function(req, res, next) {
    console.log("routerUsuarioSession");
    if ( req.session.usuario ) {
        // dejamos correr la petición
        next();
    } else {
        console.log("va a : "+req.session.destino)
        res.redirect("/identificarse");
    }
});

//Aplicar routerUsuarioSession
app.use("/articulos/agregar",routerUsuarioSession);
app.use("/articulos",routerUsuarioSession);
app.use("/cancion/comprar",routerUsuarioSession);
app.use("/compras",routerUsuarioSession);



//routerUsuarioAutor
var routerUsuarioAutor = express.Router(); 
routerUsuarioAutor.use(function(req, res, next) {
	 console.log("routerUsuarioAutor");
	 var path = require('path');
	 var id = path.basename(req.originalUrl);
	 // Cuidado porque req.params no funciona
	 // en el router si los params van en la URL.
	 
	 gestorBD.obtenerArticulos( 
			 { _id : mongo.ObjectID(id) }, function (articulos) {
		 console.log(articulos[0]); 
		 if(articulos[0].autor == req.session.usuario ){
			 next();
		 } else {
		    var criterio = { 
                usuario : req.session.usuario,
                articuloId : mongo.ObjectID(idArticulo) 
             };
                
             gestorBD.obtenerCompras(criterio ,function(compras){
                 if (compras != null && compras.length > 0  ){
                     next();
                 } else {
                     res.redirect("/tienda");
                 }
             });

		 }
	 })

});

//Aplicar routerUsuarioAutor
app.use("/articulos/modificar",routerUsuarioAutor);
app.use("/articulos/eliminar",routerUsuarioAutor);


// Acceso a ficheros estaticos
app.use(express.static('public'));

// Variables
app.set('port', process.env.PORT || 8081);
app.set('db', 'mongodb://administrador:administrador2018@ds127604.mlab.com:27604/segundamano');
app.set('clave','abcdefg');
app.set('crypto',crypto);

//Rutas/controladores por lógica
require("./routes/rusuarios.js")(app, swig, mongo, gestorBD);
require("./routes/rarticulos.js")(app, swig, mongo, gestorBD);  // (app, param1, param2, etc.)

app.get('/', function (req, res) {
	res.redirect('/tienda');
})

app.use( function (err, req, res, next ) {
    console.log("Error producido: " + err); //we log the error in our db
    if (! res.headersSent) { 
        res.status(400);
        res.send("Recurso no disponible");
    }
});

// lanzar el servidor
app.listen(app.get('port'), function() {
    console.log("Servidor activo");
});