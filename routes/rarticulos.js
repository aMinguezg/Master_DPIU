module.exports = function(app, swig, mongo, gestorBD) {

    app.get("/articulos", function (req, res) {

        var criterio = {vendedor: req.session.usuario};

        gestorBD.obtenerArticulos(criterio, function (articulos) {
            if (articulos == null) {
                res.send("Error al listar ");
            } else {
                var respuesta = swig.renderFile('views/bpublicaciones.html',
                    {
                        articulos: articulos
                    });
                res.send(respuesta);
            }
        });

    });

    app.get('/blanco', function (req, res) {
        var respuesta = swig.renderFile('views/bblanco.html', {});
        res.send(respuesta);
    });

    app.get('/inversores', function (req, res) {
        var respuesta = swig.renderFile('views/bformulario.html', {});
        res.send(respuesta);
    });

    app.get('/informacion', function (req, res) {
        var respuesta = swig.renderFile('views/binformacion.html', {});
        res.send(respuesta);
    });

    app.get('/articulos/agregar', function (req, res) {
        if (req.session.usuario == null) {
            res.redirect("/tienda");
            return;
        }

        var respuesta = swig.renderFile('views/bagregar.html', {});
        res.send(respuesta);
    });

    app.get("/tienda", function (req, res) {
        var criterio = {};
        if (req.query.busqueda != null) {
            criterio = {"nombre": {$regex: ".*" + req.query.busqueda + ".*"}};
        }

        var pg = parseInt(req.query.pg); // Es String !!!
        if ( req.query.pg == null){ // Puede no venir el param
            pg = 1;
        }
    
        gestorBD.obtenerArticulosPg(criterio, pg , function(articulos, total ) {
            if (articulos == null) {
                res.send("Error al listar ");
            } else {
                
                var pgUltima = total/4;
                if (total % 4 > 0 ){ // Sobran decimales
                    pgUltima = pgUltima+1;
                }
                
                var respuesta = swig.renderFile('views/btienda.html', 
                {
                    articulos : articulos,
                    pgActual : pg,
                    pgUltima : pgUltima
                });
                res.send(respuesta);
            }
        });
    
    });

    app.get('/articulo/:id', function (req, res) {
        var criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};

        gestorBD.obtenerArticulos(criterio, function (articulos) {
            if (articulos == null) {
                res.send(respuesta);
            } else {
                var respuesta = swig.renderFile('views/barticulo.html',
                    {
                        articulo: articulos[0]
                    });
                res.send(respuesta);
            }
        });
    });

    app.get('/articulo/modificar/:id', function (req, res) {
        var criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};

        gestorBD.obtenerArticulos(criterio, function (articulos) {
            if (articulos == null) {
                res.send(respuesta);
            } else {
                var respuesta = swig.renderFile('views/barticuloModificar.html',
                    {
                        articulo: articulos[0]
                    });
                res.send(respuesta);
            }
        });
    });

    app.post('/articulo/modificar/:id', function (req, res) {
        var id = req.params.id;
        var criterio = {"_id": gestorBD.mongo.ObjectID(id)};

        var articulo = {
            nombre: req.body.nombre,
            tipo: req.body.tipo,
            precio: req.body.precio
        }

        gestorBD.modificarArticulo(criterio, articulo, function (result) {
            if (result == null) {
                res.send("Error al modificar ");
            } else {
                paso1ModificarFoto(req.files, id, function (result) {
                    if (result == null) {
                        res.send("Error en la modificación");
                    } else {
                        res.redirect("/articulos?mensaje=Artículo modificado correctamente");
                    }
                });
            }
        });
    });


    app.post("/articulo", function (req, res) {

        if (req.session.usuario == null) {
            res.redirect("/tienda");
            return;
        }

        var articulo = {
            nombre: req.body.nombre,
            tipo: req.body.tipo,
            precio: req.body.precio,
            vendedor: req.session.usuario
        }

        // Conectarse
        gestorBD.insertarArticulo(articulo, function (id) {
            if (id == null) {
                res.send("Error al insertar ");
            } else {
                if (req.files.foto != null) {
                    var imagen = req.files.foto;
                    imagen.mv('public/fotos/' + id + '.png', function (err) {
                        if (err) {
                            res.send("Error al subir la foto");
                        } else {
                            res.redirect("/articulos?mensaje=Artículo insertado correctamente");
                        }
                    });
                }
            }
        });
    });

    app.get('/articulo/comprar/:id', function (req, res) {
        var articuloId = gestorBD.mongo.ObjectID(req.params.id);
        var compra = {
            usuario : req.session.usuario,	
            articuloId : articuloId
        }
        
        gestorBD.insertarCompra(compra ,function(idCompra){
            if ( idCompra == null ){
                res.send(respuesta);
            } else {
                res.redirect("/compras");
            }
        });
    })
    
    app.get('/compras', function (req, res) {
        var criterio = { "usuario" : req.session.usuario };
    
        gestorBD.obtenerCompras(criterio ,function(compras){
            if (compras == null) {
                res.send("Error al listar ");
            } else {
                
                var articulosCompradosIds = [];
                for(i=0; i <  compras.length; i++){
                    articulosCompradosIds.push( compras[i].articuloId );
                }
                
                var criterio = { "_id" : { $in: articulosCompradosIds } }
                gestorBD.obtenerArticulos(criterio ,function(articulos){
                    var respuesta = swig.renderFile('views/bcompras.html', 
                    {
                        articulos : articulos
                    });
                    res.send(respuesta);
                });
            }
        });
    })
    

    app.get('/articulo/eliminar/:id', function (req, res) {
        var criterio = { "_id" : gestorBD.mongo.ObjectID(req.params.id)  };
        
        gestorBD.eliminarArticulo(criterio,function(articulo){
            if ( articulo == null ){
                res.send(respuesta);
            } else {
                res.redirect("/articulos?mensaje=Artículo eliminado correctamente");
            }
        });
    })
    
}


function paso1ModificarFoto(files, id, callback) {
    if (files.portada != null) {
        var imagen = files.foto;
        imagen.mv('public/fotos/' + id + '.png', function (err) {
            if (err) {
                callback(null); // ERROR
            } else {
                callback(true); // SIGUIENTE
            }
        });
    } else {
        callback(true);
    }
}


