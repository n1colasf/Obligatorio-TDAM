//-- VARIABLES GLOBALES ------------------------------------------------------------------>
var map;
var envioActivo;
var info_compartir;

var enviosUsuario = [];
var totalCiudades = [];
var departamentos = [];
var categorias = [];

//-- FUNCIONES AUXILIARES ------------------------------------------------------------------>

function ordenarPorCantidad(_a, _b) {
  let ponderacion;
  if (_a.cantidad > _b.cantidad) {
    ponderacion = -1;
  } else {
    ponderacion = 1;
  }
  return ponderacion;
}

async function cerrar_app() {
  const alerta = await alertController.create({
    header: "THE SILK ROAD",
    subHeader: "Cerrar Aplicación",
    message: "¿Seguro que desea cerrar la app?",
    buttons: [
      {
        text: "SI",
        handler: function () {
          if (
            Capacitor.isNativePlatform() &&
            Capacitor.isPluginAvailable("App")
          ) {
            Capacitor.Plugins.App.exitApp();
          }
        },
      },
      {
        text: "NO",
      },
    ],
  });
  await alerta.present();
}

async function cerrar_sesion() {
  const alerta = await alertController.create({
    header: "THE SILK ROAD",
    subHeader: "Cerrar Sesión",
    message: "¿Seguro que desea cerrar sesión?",
    buttons: [
      {
        text: "SI",
        handler: function () {
          let router = document.querySelector("ion-router");
          sessionStorage.removeItem("apiKey");
          sessionStorage.removeItem("usuario");
          sessionStorage.removeItem("nombre");
          router.push("/");
          display_toast(
            "La sesión ha finalizado correctamente",
            "Info",
            "primary"
          );
        },
      },
      {
        text: "NO",
      },
    ],
  });
  await alerta.present();
}

async function vibrar() {
  await Capacitor.Plugins.Haptics.vibrate();
}

function rad(x) {
  return (x * Math.PI) / 180;
}

async function obtenerGeolocalizacion() {
  if (
    Capacitor.isNativePlatform() &&
    Capacitor.isPluginAvailable("Geolocation")
  ) {
    return await Capacitor.Plugins.Geolocation.getCurrentPosition();
  } else {
    throw "Geolocation no disponible";
  }
}

async function obtenerDatosDispositivo() {
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Device")) {
    return await Capacitor.Plugins.Device.getInfo();
  } else {
    throw "Device no disponible";
  }
}

async function obtenerConexionInternet() {
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Network")) {
    return await Capacitor.Plugins.Network.getStatus();
  } else {
    throw "Network no disponible";
  }
}

function display_toast(mensaje, header, color) {
  const toast = document.createElement("ion-toast");
  toast.header = header;
  (toast.icon = "information-circle"), (toast.position = "top");
  toast.message = mensaje;
  toast.duration = 3000;
  toast.color = color;
  document.body.appendChild(toast);
  toast.present();
}

function getParam(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

//-- LOGIN ------------------------------------------------------------------>

function login(data, router) {
  sessionStorage.setItem("apiKey", data.apiKey);
  sessionStorage.setItem("usuario", JSON.stringify(data.id));
  cargar_ciudades();
  cargar_deptos();
  cargar_categorias();
  router.push("/envios");
}

//-- ENVIOS ------------------------------------------------------------------>

//LISTAR ENVIOS ------------------------------>
function listar_envios() {
  let apiKey = sessionStorage.getItem("apiKey");
  let usuario = sessionStorage.getItem("usuario");

  const url = `https://envios.develotion.com/envios.php?idUsuario=${usuario}`;
  fetch(url, {
    headers: {
      apikey: `${apiKey}`,
      "Content-Type": "application/json",
    },
  })
    .then((respuesta) => respuesta.json())
    .then((data) => {
      enviosUsuario = data.envios;
      crear_listado_envios();
    })
    .catch((error) => {
      display_toast(error, "Info", "primary");
    });
}

//CREAR LISTA ENVIOS ------------------------------>
function crear_listado_envios() {
  let lista = document.getElementById("list_envios");
  lista.innerHTML = "";
  let item = "";

  enviosUsuario.forEach(function (envio) {
    let nombre1;
    let dep1;
    let nombre2;
    let dep2;
    totalCiudades.forEach(function (ciudad) {
      if (ciudad.id == envio.ciudad_origen) {
        nombre1 = ciudad.nombre;
        dep1 = ciudad.codigo_departamento;
      } else if (ciudad.id == envio.ciudad_destino) {
        nombre2 = ciudad.nombre;
        dep2 = ciudad.codigo_departamento;
      }
    });
    item = `<br>
        <ion-card>
        <ion-card-content>
          <h2>Ciudad Origen: <strong>${nombre1}, ${dep1}</strong></h2>
          <h2>Ciudad Destino: <strong>${nombre2}, ${dep2}</strong></h2>
          <p>Distancia: ${envio.distancia} km</p>
          <p><strong>Precio: $ ${envio.precio}</strong></p>
        <ion-grid>
        <ion-row>
            <ion-col size="6">
                <ion-button color="success" size="small" href="/detalle?id=${envio.id}" expand="block" id="btn_envio_info">Detalles</ion-button>
            </ion-col>
            <ion-col size="6">
            <ion-button class="clase-btn-eliminar" color="danger" size="small" expand="block" id="${envio.id}">Eliminar</ion-button>
        </ion-col>
        </ion-row>
    </ion-grid>
    </ion-card>`;
    lista.innerHTML += item;
  });
}

//DETALLE DE ENVIO ------------------------------>
function detalle_envio() {
  const envio_id = getParam("id");

  envioActivo = envio_id;

  let usuario = sessionStorage.getItem("usuario");
  let apiKey = sessionStorage.getItem("apiKey");

  fetch(`https://envios.develotion.com/envios.php?idUsuario=${usuario}`, {
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
  })
    .then((response) => response.json())
    .then((response) => {
      response.envios.forEach(function (envio) {
        if (envio_id == envio.id) {
          let nombre1;
          let dep1;
          let nombre2;
          let dep2;
          let lat1;
          let long1;
          let lat2;
          let long2;

          totalCiudades.forEach(function (ciudad) {
            if (ciudad.id == envio.ciudad_origen) {
              nombre1 = ciudad.nombre;
              dep1 = ciudad.codigo_departamento;
              lat1 = ciudad.latitud;
              long1 = ciudad.longitud;
            } else if (ciudad.id == envio.ciudad_destino) {
              nombre2 = ciudad.nombre;
              dep2 = ciudad.codigo_departamento;
              lat2 = ciudad.latitud;
              long2 = ciudad.longitud;
            }
          });

          let nombre_cat;
          categorias.forEach(function (categoria) {
            if (categoria.id == envio.id_categoria) {
              nombre_cat = categoria.nombre;
            }
          });

          document.getElementById(
            "det_id"
          ).innerHTML = `ID de envío: ${envio.id}`;
          document.getElementById(
            "det_ciudadOrigen"
          ).innerHTML = `Origen: ${nombre1}, ${dep1}`;
          document.getElementById(
            "det_ciudadDestino"
          ).innerHTML = `Destino: ${nombre2}, ${dep2}`;
          document.getElementById(
            "det_peso"
          ).innerHTML = `Peso: ${envio.peso} kg`;
          document.getElementById(
            "det_distancia"
          ).innerHTML = `Distancia: ${envio.distancia} km`;
          document.getElementById(
            "det_precio"
          ).innerHTML = `Precio: $ ${envio.precio}`;
          document.getElementById(
            "det_categoria"
          ).innerHTML = `Categoria: ${nombre_cat}`;

          let distancia = calcular_distancia(lat1, long1, lat2, long2);

          if (map != undefined) {
            map.remove();
          }
          map = L.map("map").setView([-32.522779, -55.765835], 6);
          L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {}
          ).addTo(map);

          L.marker([lat1, long1])
            .addTo(map)
            .bindPopup(
              `<strong>Origen: ${nombre1} <br>Destino: ${nombre2}</strong><br>Distancia: ${distancia} km`
            )
            .openPopup();
          L.marker([lat2, long2]).addTo(map);

          L.polygon([
            [lat1, long1],
            [lat1, long1],
            [lat2, long2],
          ]).addTo(map);
        }
      });
    });
}

// FUNCION COMPARTIR ------------------------------------------------------------------>
async function compartir_envio() {
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Share")) {
    await Capacitor.Plugins.Share.share({
      title: `Id Envio: ${info_compartir.id}`,
      text: `Id Usuario: ${info_compartir.id_usuario}
      Origen: ${info_compartir.ciudad_origen} 
      Destino: ${info_compartir.ciudad_destino} 
      Peso: ${info_compartir.peso} 
      Distancia: ${info_compartir.distancia} 
      Precio: ${info_compartir.precio} 
      Categoria: ${info_compartir.id_categoria}`,
      url: `https://www.google.com/search?q=the silk road`,
      dialogTitle: "Compartir Envío",
    });
  }
}

//-- CIUDADES DEPARTAMENTOS Y CATEGORIAS ------------------------------------------------------------------>

//GUARDAR CIUDADES ------------------------------>
function cargar_ciudades() {
  let apiKey = sessionStorage.getItem("apiKey");

  const url = `https://envios.develotion.com/ciudades.php`;
  fetch(url, {
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
  })
    .then((respuesta) => respuesta.json())
    .then((data) => {
      totalCiudades = data.ciudades;
    });
}

//CREAR SELECT CIUDADES ENVIOS------------------------------>
function select_ciudades_envios() {
  let select_origen = document.getElementById("enviar_origen");
  let select_destino = document.getElementById("enviar_destino");

  select_origen.innerHTML = "";
  select_destino.innerHTML = "";

  let item = "";

  totalCiudades.forEach(function (ciudad) {
    item = `<ion-select-option value="${ciudad.id}">${ciudad.nombre}, ${ciudad.codigo_departamento}</ion-select-option>`;
    select_origen.innerHTML += item;
    select_destino.innerHTML += item;
  });
}

//CREAR SELECT CIUDADES CALCULADORA------------------------------>
function select_ciudades_calc() {
  let select_origen = document.getElementById("calc_origen");
  let select_destino = document.getElementById("calc_destino");

  select_origen.innerHTML = "";
  select_destino.innerHTML = "";

  let item = "";

  totalCiudades.forEach(function (ciudad) {
    item = `<ion-select-option value="${ciudad.id}">${ciudad.nombre}, ${ciudad.codigo_departamento}</ion-select-option>`;
    select_origen.innerHTML += item;
    select_destino.innerHTML += item;
  });
}

//GUARDAR DEPARTAMENTOS ------------------------------>
function cargar_deptos() {
  let apiKey = sessionStorage.getItem("apiKey");

  const url = `https://envios.develotion.com/departamentos.php`;
  fetch(url, {
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
  })
    .then((respuesta) => respuesta.json())
    .then((data) => {
      departamentos = data.departamentos;
    });
}

//GUARDAR CATEGORIAS ------------------------------>
function cargar_categorias() {
  let apiKey = sessionStorage.getItem("apiKey");

  const url = ` https://envios.develotion.com/categorias.php`;
  fetch(url, {
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
  })
    .then((respuesta) => respuesta.json())
    .then((data) => {
      categorias = data.categorias;
    });
}

//CREAR SELECT CATEGORIAS ------------------------------>
function select_categorias() {
  let select_cat = document.getElementById("enviar_categoria");

  select_cat.innerHTML = "";

  let item = "";

  categorias.forEach(function (categoria) {
    item = `<ion-select-option value="${categoria.id}">${categoria.nombre}</ion-select-option>`;
    select_cat.innerHTML += item;
  });
}

//CIUDAD MAS CERCANA ------------------------------>
function ciudad_cercana() {
  // obtenerGeolocalizacion().then((coordinates) => {
  //   let lat_dispositivo = coordinates.coords.latitude;
  //   let lon_dispositivo = coordinates.coords.longitude;

  let lat_dispositivo = -36;
  let lon_dispositivo = -55;

  let lat_ciudad;
  let lon_ciudad;
  let nombre;
  let departamento;
  let codigoPais;
  let distancia = 999999999999;

  totalCiudades.forEach(function (ciudad) {
    let dist_aux = calcular_distancia(
      lat_dispositivo,
      lon_dispositivo,
      ciudad.latitud,
      ciudad.longitud
    );
    if (dist_aux < distancia && dist_aux > 0) {
      distancia = dist_aux;
      lat_ciudad = ciudad.latitud;
      lon_ciudad = ciudad.longitud;
      nombre = ciudad.nombre;
      departamento = ciudad.codigo_departamento;
      codigoPais = ciudad.codigo_pais;
    }
  });
  let card = document.getElementById("card_cercana");

  card.innerHTML = `<ion-card-header>
  <h4>País: ${codigoPais}</h4>
    <ion-card-title color="success"><h2>${nombre}, ${departamento}<h2></ion-card-title>
    <ion-card-subtitle>Distancia: ${distancia} km</ion-card-subtitle>
    </ion-card-header>
    <ion-card>
    </ion-card>
    <div id="map_cercano"></div>`;

  if (map != undefined) {
    map.remove();
  }
  map = L.map("map_cercano").setView([lat_dispositivo, lon_dispositivo], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {}).addTo(
    map
  );

  L.marker([lat_dispositivo, lon_dispositivo])
    .addTo(map)
    .bindPopup(
      `Mi ubicación: Latitud: ${lat_dispositivo.toFixed(
        2
      )} Longitud: ${lon_dispositivo.toFixed(
        2
      )}<br>Ciudad Cercana: ${nombre}<br>Distancia: ${distancia} km`
    )
    .openPopup();
  L.marker([lat_ciudad, lon_ciudad]).addTo(map);
  // });
}

//TOP 5 DEPARTAMENTOS ------------------------------>
class Departamento {
  id;
  codigo;
  nombre;
  cantidad;
  constructor(_id, _codigo, _nombre) {
    this.id = _id;
    this.codigo = _codigo;
    this.nombre = _nombre;
    this.cantidad = 0;
  }
}

function top_departamentos() {
  let dep_envios_usuario = [];
  let top_cinco = [];

  enviosUsuario.forEach(function (envio) {
    let id;
    let codigo;
    let nombre;
    let cantidad = 0;

    totalCiudades.forEach(function (ciudad) {
      if (envio.ciudad_destino == ciudad.id) {
        id = ciudad.id_departamento;
        codigo = ciudad.codigo_departamento;
      }
      departamentos.forEach(function (depto) {
        if (id == depto.id) {
          nombre = depto.nombre;
          cantidad++;
        }
      });
    });

    dep_envios_usuario.push(new Departamento(id, codigo, nombre, cantidad));

    //top_cinco = ordenarPorCantidad(dep_envios_usuario);
    top_cinco = dep_envios_usuario;

    let card = document.getElementById("card_top");
    card.innerHTML = "";
    let item = "";

    item += `<br>
        <ion-card>
        <ion-card-content>
        <p>ID: ${id}     CODIGO: ${codigo}</p>
          <h2 color=>Nombre: <strong>${nombre}</strong></h2>
          <h4>Cantidad: <strong>${cantidad}</strong></h4>
          </ion-card-content>
        </ion-card>`;
    card.innerHTML += item;
  });
}

//-- CALCULOS ------------------------------------------------------------------>
//CALCULAR COSTO TOTAL ------------------------------>
function costo_total() {
  let id_usuario = sessionStorage.getItem("usuario");

  let precio = 0;
  let cantidad = 0;

  enviosUsuario.forEach(function (envio) {
    if (id_usuario == envio.id_usuario) {
      precio += envio.precio;
      cantidad++;
    }
  });

  document.getElementById("gasto_id").innerHTML = `ID Usuario: ${id_usuario}`;
  document.getElementById(
    "gasto_precioTotal"
  ).innerHTML = `Total: $ ${precio.toFixed(2)}`;
  document.getElementById(
    "gasto_cantidad"
  ).innerHTML = `<strong>Cantidad de envíos: ${cantidad}</strong>`;
}

//CALCULAR DISTANCIA ------------------------------>
function calcular_distancia(lat1, lon1, lat2, lon2) {
  var R = 6378.137; //Radio de la tierra en km
  var dLat = rad(lat2 - lat1);
  var dLong = rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(lat1)) *
      Math.cos(rad(lat2)) *
      Math.sin(dLong / 2) *
      Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d.toFixed(1); //Retorna 1 decimal
}

//-- FUNCIONES DEL DOM ------------------------------------------------------------------>
//--------------------------------------------------------------------------------------->
//--------------------------------------------------------------------------------------->

document.addEventListener("DOMContentLoaded", function () {
  let iconos_logout = document.getElementsByClassName("log_out");
  for (let i = 0; i < iconos_logout.length; i++) {
    const element = iconos_logout[i];
    element.addEventListener("click", cerrar_sesion);
  }
  let iconos_cerrar_app = document.getElementsByClassName("cerrar_app");
  for (let i = 0; i < iconos_cerrar_app.length; i++) {
    const element = iconos_cerrar_app[i];
    element.addEventListener("click", cerrar_app);
  }
  obtenerConexionInternet()
    .then((estatus) => {
      if ("none" == estatus.connectionType) {
        display_toast("Se perdió la conexión a Internet", "Info", "primary");
      } else {
        display_toast(
          `Tu conexión a Internet es ${estatus.connectionType}`,
          "Info",
          "primary"
        );
      }
    })
    .catch((error) => display_toast(error, "Aviso", "warning"));

  //CAPACITOR ------------------------------------------------------------------>
  // if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Network")) {
  //   Capacitor.Plugins.Network.addListener("networkStatusChange", (status) => {
  //     if ("none" == status.connectionType) {
  //       if (Capacitor.isPluginAvailable("Haptics")) {
  //         vibrar();
  //       }
  //       display_toast("Se perdió la conexión a Internet", "Info", "primary");
  //     } else {
  //       display_toast(
  //         "Se restableció la conexión a Internet",
  //         "Info",
  //         "primary"
  //       );
  //     }
  //   });
  // }

  //CREAR DIRECCIONES Y CARGAR CONTENIDO ------------------------------------------------------------------>
  let router = document.querySelector("ion-router");
  router.addEventListener("ionRouteDidChange", function (e) {
    menuController.close();

    let nav = e.detail;
    let paginas = document.getElementsByTagName("ion-page");
    for (let i = 0; i < paginas.length; i++) {
      paginas[i].style.visibility = "hidden";
    }
    let ion_route = document.querySelectorAll(`[url="${nav.to}"]`);
    let id_pagina = ion_route[0].getAttribute("component");
    let pagina = document.getElementById(id_pagina);
    pagina.style.visibility = "visible";

    if (nav.to == "/envios") {
      listar_envios();
    }
    if (nav.to == "/detalle") {
      detalle_envio();
    }
    if (nav.to == "/enviar") {
      select_ciudades_envios();
      select_categorias();
    }
    if (nav.to == "/calcular") {
      select_ciudades_calc();
    }
    if (nav.to == "/gastos") {
      costo_total();
    }
    if (nav.to == "/cerca") {
      ciudad_cercana();
    }
    if (nav.to == "/ranking") {
      top_departamentos();
    }
  });

  //BOTONES --------------------------------------------------------------------------------->

  //BOTON REGISTRO ------------------------------>
  document.getElementById("btn_registro").onclick = function () {
    try {
      const usuario = document.getElementById("inp_reg_usuario").value;
      const password = document.getElementById("inp_reg_password").value;
      const idDepartamento = document.getElementById("inp_reg_password").value;
      const idCiudad = document.getElementById("inp_reg_password").value;


      if (!usuario) {
        throw "Usuario requerido";
      }
      if (!password) {
        throw "Contraseña requerida";
      }
      const url = "https://crypto.develotion.com/usuarios.php";
      const datos = {
        usuario: usuario,
        password: password,
        idDepartamento: idDepartamento,
        idCiudad: idCiudad,
      };
      fetch(url, {
        method: "POST",
        body: JSON.stringify(datos),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((respuesta) =>
          respuesta.ok
            ? respuesta.json()
            : respuesta
                .text()
                .then((text) => Promise.reject(JSON.parse(text).error))
        )
        .then((data) => router.push("/"))
        .catch((mensaje) => display_toast(mensaje, "Info", "primary"));
    } catch (e) {
      display_toast(e, "Info", "primary");
    }
  };

  //BOTON LOGIN ------------------------------>
  document.getElementById("btn_login").onclick = function () {
    const usuario = document.getElementById("inp_usuario").value;
    const password = document.getElementById("inp_password").value;
    try {
      if (!usuario) {
        throw "Usuario requerido";
      }
      if (!password) {
        throw "Contraseña requerida";
      }
      const url = "https://envios.develotion.com/login.php";

      sessionStorage.setItem("nombre", usuario);

      fetch(url, {
        method: "POST",
        body: JSON.stringify({ usuario: usuario, password: password }),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((respuesta) =>
          respuesta.ok
            ? respuesta.json()
            : respuesta
                .text()
                .then((text) => Promise.reject(JSON.parse(text).error))
        )
        .then((data) => login(data, router))
        .catch((mensaje) => display_toast(mensaje, "No autorizado", "primary"));
    } catch (e) {
      display_toast(e, "Info", "primary");
    }
  };

  //BOTON AGREGAR ENVIO ------------------------------>
  document.getElementById("btn_enviar").addEventListener("click", btnEnviar);

  function btnEnviar() {
    let usuario = sessionStorage.getItem("usuario");
    let apiKey = sessionStorage.getItem("apiKey");

    const origen = document.getElementById("enviar_origen").value;
    const destino = document.getElementById("enviar_destino").value;
    const categoria = document.getElementById("enviar_categoria").value;
    const peso = document.getElementById("enviar_peso").value;

    let lat1;
    let long1;
    let lat2;
    let long2;

    totalCiudades.forEach(function (ciudad) {
      if (ciudad.id == origen) {
        lat1 = ciudad.latitud;
        long1 = ciudad.longitud;
      } else if (ciudad.id == destino) {
        lat2 = ciudad.latitud;
        long2 = ciudad.longitud;
      }
    });
    let dist = calcular_distancia(lat1, long1, lat2, long2);
    let multiplicador;
    if (dist > 100) {
      multiplicador = Math.trunc(dist) / 100;
    } else {
      multiplicador = 1;
    }
    let precio = 50 + 10 * Math.trunc(peso) + 50 * multiplicador;

    try {
      if (!origen) {
        throw "Origen requerido";
      }
      if (!destino) {
        throw "Destino requerido";
      }
      if (!categoria) {
        throw "Categoria requerida";
      }
      if (!peso) {
        throw "Peso requerido";
      }
      const url = "https://envios.develotion.com/envios.php";
      const datos = {
        idUsuario: usuario,
        idCiudadOrigen: origen,
        idCiudadDestino: destino,
        peso: peso,
        distancia: dist,
        precio: precio,
        idCategoria: categoria,
      };
      fetch(url, {
        method: "POST",
        body: JSON.stringify(datos),
        headers: {
          apikey: apiKey,
          "Content-Type": "application/json",
        },
      }).then((data) => {
        display_toast("Envío ingresado con éxito", "Info", "primary");
        router.push("/envios");
      });
    } catch (e) {
      display_toast("El envío no se ha registrado", "Info", "primary");
    }
  }

  //BOTON CALCULAR DISTANCIA ------------------------------>
  document.getElementById("btn_calc").onclick = function () {
    let id_ciudad1 = document.getElementById("calc_origen").value;
    let id_ciudad2 = document.getElementById("calc_destino").value;

    if (!id_ciudad1) {
      throw "Ciudad requerida";
    }
    if (!id_ciudad2) {
      throw "Ciudad requerida";
    }
    let lat1;
    let long1;
    let lat2;
    let long2;
    let nombre1;
    let nombre2;

    let card = document.getElementById("card_calcular");

    totalCiudades.forEach(function (ciudad) {
      if (id_ciudad1 == ciudad.id) {
        lat1 = ciudad.latitud;
        long1 = ciudad.longitud;
        nombre1 = ciudad.nombre;
      } else if (ciudad.id == id_ciudad2) {
        lat2 = ciudad.latitud;
        long2 = ciudad.longitud;
        nombre2 = ciudad.nombre;
      }
    });

    let distancia = calcular_distancia(lat1, long1, lat2, long2);

    card.innerHTML = ` <ion-card-header>
    <ion-card-title color="success">Distancia: ${distancia} km</ion-card-title>
</ion-card-header>
<ion-card-content>
    <p><strong>Origen:</strong> ${nombre1}</p>
    <p><strong>Destino:</strong> ${nombre2}</p>
</ion-card-content>
<ion-card>
<div id="map_calcular"></div>
</ion-card>`;

    if (map != undefined) {
      map.remove();
    }
    map = L.map("map_calcular").setView([-33.0, -56.0], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {}).addTo(
      map
    );

    L.marker([lat1, long1]).addTo(map);
    L.marker([lat2, long2]).addTo(map);
  };

  // BOTON COMPARTIR ------------------------------>
  document.getElementById("btn_compartir").onclick = function () {
    compartir_envio();
  };

  // BOTONES ELIMINAR ------------------------------>
  document.getElementById("btn_det_eliminar").onclick = function () {
    let apiKey = sessionStorage.getItem("apiKey");

    try {
      const url = "https://envios.develotion.com/envios.php";

      fetch(url, {
        method: "DELETE",
        body: JSON.stringify({ idEnvio: envioActivo }),
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
      })
        .then((respuesta) =>
          respuesta.ok
            ? respuesta.json()
            : respuesta
                .text()
                .then((text) => Promise.reject(JSON.parse(text).error))
        )
        .then((data) => {
          console.log(data);
          display_toast(data.mensaje, "Info", "primary");
          router.push("/envios");
        });
    } catch (e) {
      display_toast(e, "Info", "primary");
    }
  };
});
