// JavaScript Document
// JavaScript Document
var aux;
var aux_cat_0;
var aux_cat_1;

var formFlash;

// INICIO: Estos se inicializan en inicializa //
var cadena_pregunta;
var id_curso = ""; // id_curso=0 (CAP, 4 respuestas) - id_curso!=0 (3 respuestas)
var ayuda_pregunta = 0;
autocorreccion_test = 0;
var tipo_test = 0; // 0: Tests Aleatorios - 1: InfoTest
var idioma_permiso = "";
// FIN

var vectorImagenesIntro = new Array();
var modo_infotest = false;

var foto_alumno;
var cdialumno;
var nombre_alumno;
var logo_ae;

var npreg = 0;
var vpreg = new Array();
var identificador_curso = "";
var tipo_test = 0;// 0: Tests Aleatorios - 1: Infotest
var nombre_test = "";		
var modo_infotest = false;

var preguntas = new Array();
var fotos_preguntas = new Array();

var cdialumno;
var nombre_alumno;
var premium_alumno;

var primera_pregunta_no_contestada;

var idioma_permiso;
var cdicurso;
var cdipermiso;
var num_cursos;
var programa;
var cdiae;

var cdicategoria;
var cditest;

var cdicategoria_aleatorio;

var peticion_servidor;

var cdiconexion;

var intervalo_ps;

// MOD 23/10
var cadena_respuestas_correctas = "";
var num_fallos_permiso = 0;

// Traductor Google Cloud Translator
var idiomaTraduccion;
var traducir;

// Funciones para el visor

function cierraVisor()
{
	if (document.getElementById("cajaGaleria"))
	{
		var contenedor = document.getElementById("contenedor_div");
		contenedor.parentNode.removeChild(contenedor);
		
		var caja = document.getElementById("cajaGaleria");
		caja.parentNode.removeChild(caja);
	}	
}

function abrirVisor(nombre,tipo)
{
	var caja = document.createElement("div");				
	caja.id = "cajaGaleria";
	caja.style.backgroundColor = "#AAB1B3";
	document.body.appendChild(caja);
	caja.style.width = document.body.scrollWidth + "px";
	caja.style.height = document.body.scrollHeight + "px";
	
	var elContenedor = document.createElement("div");
	elContenedor.id = "contenedor_div";	
	elContenedor.innerHTML = "cargando ...";	
	
	var x = Math.floor((screen.width-532)/2);
	var y = Math.floor((screen.height-200)/2);
	
	elContenedor.style.left = x + "px";
	elContenedor.style.top = y + "px";	
	
	document.body.appendChild(elContenedor);
	
}

// FIN funciones para el visor

function creaAjax()
{
	if (navigator.appName != "Microsoft Internet Explorer")
	{
		var cargador = new XMLHttpRequest();
	}
	else
	{
		var cargador = new ActiveXObject('Microsoft.XMLHTTP');
	}
	return cargador;
}
  
function detectBrowser() 
{
  
  var isIE = /*@cc_on!@*/false;
  
  return isIE;

}

function abandonar_flash(nombre)
{
	var form = document.FAbandonar;

	// Para alumnos profe web monitorizados
	if (sessionStorage.getItem("spwm")) {

		var cdisesion = sessionStorage.getItem("spwm");

		var formdata = new FormData();		
	
		if (formdata)
		{					
			formdata.append('cdisesion', cdisesion);								
		}

		var url_script = "php_script/grabar_tiempo_test_monitorizado_no_finalizado.php";
		
		if(formdata){
			$.ajax({
				url : url_script,
				type : 'POST',
				data : formdata,
				processData : false, 
				contentType : false, 
				success : function(res){

					form.submit();							
				},
				error : function(res){
					form.submit();
				}              
			});
		}
	} else {
		form.submit();	
	}
}

function abandonar_flash_sin_alert()
{
	var form = document.FAbandonar;	
	form.submit();
	
}

function mensajito(cadena)
{
	alert(cadena);
}

function hacer_test(nombre)
{
	var form = document.FTest;
	var form1 = document.FFlash;
	
	if (form.cditest.value == "")
	{
	}
	else
	{	
		//if(confirm("Va a realizar el test asociado al tema \""+nombre+"\".\nżDesea continuar?"))
		//{
			if (form1.modo_vtest.value == "0")
				form.action = "alumno_test_infotest_profe_mono.php";
			else
				form.action = "alumno_test_infotest_profe.php";
				
			form.submit();
		//}
	}
	
}

function muestra_flash_param ()
{	
	var form = document.FFlash;
	
	var nombre = "fullscreen";
	var ancho = 1024;
	var alto = 768;
	var color = "#FFF";
	
	var logo_ae = form.logo_ae.value;	
	var foto_alumno = form.foto_alumno.value;
	var nombre_alumno = form.nombre_alumno.value;	
	var cdialumno = form.cdialumno.value;
	var cdiae = form.cdiae.value;
	var cdiconexion = form.cdiconexion.value;
	var PA = form.PA.value;
	var IP = form.IP.value;
	var num_cursos = form.num_cursos.value;
	var tipo_test = form.tipo_test.value;
	var premium = form.premium.value;
	var ayuda = form.ayuda.value;
	var cdicurso = form.cdicurso.value;
	var cdipermiso = form.cdipermiso.value;
	var programa = form.programa.value;
	var volviendo = form.volviendo.value;
	var modo_vtest = form.modo_vtest.value;
	
	//if (parseInt(cdiae) <= 2)      // Líneas de prueba de fullscreen ITE
	//	nombre = "fullscreen_ite"; // Líneas de prueba de fullscreen ITE
			
	var cadena ="<object width='"+ancho+"' height='"+alto+"' id='"+nombre+"'>";
	cadena +="<param name='allowScriptAccess' value='sameDomain'>";
	cadena +="<param name='movie' value='" + nombre + ".swf?logo_ae=" + escape(logo_ae) + "&foto_alumno=" + escape(foto_alumno) + "&nombre_alumno=" + escape(nombre_alumno) + "&cdialumno=" + escape(cdialumno) + "&cdiae=" + escape(cdiae) + "&cdiconexion=" + escape(cdiconexion) + "&PA=" + PA + "&IP=" + IP + "&num_cursos=" + num_cursos + "&tipo_test=" + tipo_test + "&premium=" + premium + "&ayuda=" + ayuda + "&cdicurso=" + cdicurso + "&cdipermiso=" + cdipermiso + "&programa=" + programa + "&volviendo=" + volviendo + "&modo_vtest=" + modo_vtest + "&cadena_pregunta=" + escape(cadena_pregunta) + "&id_curso=" + id_curso + "&tipo_test=" + tipo_test + "&idioma_permiso=" + idioma_permiso + "'>";
	cadena +="<param name='quality' value='high'>";
	cadena +="<param name='allowFullScreen' value='true'>";
	cadena +="<param name='menu' value='false'>";
	cadena +="<param name='wmode' value='transparent'>";
	cadena +="<param name='bgcolor' value='"+color+"'>";
	cadena +="<embed src='" + nombre + ".swf?logo_ae=" + escape(logo_ae) + "&foto_alumno=" + escape(foto_alumno) + "&nombre_alumno=" + escape(nombre_alumno) + "&cdialumno=" + escape(cdialumno) + "&cdiae=" + escape(cdiae) + "&cdiconexion=" + escape(cdiconexion) + "&PA=" + PA + "&IP=" + IP + "&num_cursos=" + num_cursos + "&tipo_test=" + tipo_test + "&premium=" + premium + "&ayuda=" + ayuda + "&cdicurso=" + cdicurso + "&cdipermiso=" + cdipermiso + "&programa=" + programa + "&volviendo=" + volviendo + "&modo_vtest=" + modo_vtest + "&cadena_pregunta=" + escape(cadena_pregunta) + "&id_curso=" + id_curso + "&tipo_test=" + tipo_test + "&idioma_permiso=" + idioma_permiso + "' quality='high' bgcolor='"+color+"' width='"+ancho+"' height='"+alto+"' name='"+nombre+"' wmode='transparent' align='middle' allowfullscreen='true' allowScriptAccess='sameDomain' type='application/x-shockwave-flash' pluginspage='http://www.macromedia.com/go/getflashplayer'></embed>";
	cadena +="</object>";	
	
	return cadena;
}


function color_fondo(color)
{
	document.body.style.backgroundColor= "#"+color;
}

function muestra_caja_flash()
{
	cierraVisor();
}

function mostar_CL ()
{
	window.open('luces/cuadro.htm','',' width= 800,height=604,top=' + (((screen.height - 604)/2)-60) + ',left=' + (screen.width - 800)/2 + ',resizable=no,scrollbars=no');
}

function muestra_error(cadena)
{
	alert("ˇATENCIÓN! Se ha producido un error en la carga de \"" + cadena + "\".\n\nVuelva a intentarlo pasados unos minutos.\nSi el problema persiste póngase en contacto con su AutoEscuela.");	
	document.FAbandonar.submit();
}

function corregir_test(tiempo,mis_respuestas)
{
	var vpreg = cadena_pregunta.split("#");
	var npreg = vpreg.length;
	var mis_respuestas = "";
	var form;
	var seguir = true;
	var cadena_test = "";
	
	if (tiempo==2)
	{		
		cadena_test = "Se dispone a corregir el Test y mostrar los resultados.\n\n- Las preguntas acertadas suman 1 punto\n- Las preguntas falladas restan 0,5 puntos\n- Las preguntas no contestadas no se contabilizan (suman 0 puntos)\n\nPulse 'Aceptar' para comenzar el proceso o 'Cancelar' para continuar con la realización del Test.";				
		
		for (i=1;i<=npreg;i++)
		{		
			form = eval("document.form_pregunta_" + i);		
			if (form.seleccionada.value==0 && tiempo==2)
			{		
				cadena_test = "Se dispone a corregir el Test y mostrar los resultados aunque el test no ha sido contestado completamente.\n\n- Las preguntas acertadas suman 1 punto\n- Las preguntas falladas restan 0,5 puntos\n- Las preguntas no contestadas no se contabilizan (suman 0 puntos)\n\nPulse 'Aceptar' para comenzar el proceso o 'Cancelar' para continuar con la realización del Test.";				
			}
			if (mis_respuestas=="")
				mis_respuestas += form.seleccionada.value;
			else
				mis_respuestas += "#" + form.seleccionada.value;			
		}
		
		if(confirm(cadena_test))
		{
			document.FCorregir.respuestas.value = mis_respuestas;			
			document.FCorregir.submit();		
		}
	}
	else
	{	
		for (i=1;i<=npreg;i++)
		{		
			form = eval("document.form_pregunta_" + i);		
			if (form.seleccionada.value==0 && tiempo==1)
			{
				seguir = false;
				alert("El test no ha sido contestado completamente.\n\nPara corregir el test necesita contestar las " + npreg + " preguntas que lo forman.\nPulse Aceptar para colocarse en la primera pregunta aún no contestada.");
				break;
			}		
			else
			{
				if (mis_respuestas=="")
					mis_respuestas += form.seleccionada.value;
				else
					mis_respuestas += "#" + form.seleccionada.value;
			}
		}
		
		if (seguir)
		{
			if (tiempo==1)
			{
				if(confirm("Se dispone a corregir el Test y mostrar los resultados.\n\nPulse 'Aceptar' para comenzar el proceso o 'Cancelar' para continuar con la realización del Test."))
				{
					document.FCorregir.respuestas.value = mis_respuestas;			
					document.FCorregir.submit();
				}
			}
			else
			{
				document.FCorregir.respuestas.value = mis_respuestas;					
				document.FCorregir.submit();
			}
		}	
		else
		{
			location.href = "#la_pregunta_" + i;
		}
	}
}

/*function alert(mensaje)
{
	alert(mensaje);
}*/

function peticion_server ()
{
	var cargador2 = creaAjax();
	var query_string = "";
		
	cargador2.open("POST","php_script/peticion_server.php",true);	
	
	cargador2.onreadystatechange=function()
	{
		if (cargador2.readyState==4)
		{			
			respuesta = cargador2.responseText;		
			//alert(respuesta);
		}		
	}
	cargador2.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	cargador2.send(query_string);
}

function cargarTest ()
{	
	foto_alumno=formFlash.foto_alumno.value;
	cdialumno=formFlash.cdialumno.value;
	nombre_alumno=formFlash.nombre_alumno.value;
	premium_alumno = formFlash.premium.value;
	
	logo_ae=formFlash.logo_ae.value;
	
	vpreg = cadena_pregunta.split("#");	
	npreg = vpreg.length;	
	
	cdicurso = formFlash.cdicurso.value;
	cdipermiso = formFlash.cdipermiso.value;
	tipo_test = formFlash.tipo_test.value;
	num_cursos = formFlash.num_cursos.value;
	programa = formFlash.programa.value;
	cdiae = formFlash.cdiae.value;

	idiomaTraduccion = formFlash.idioma.value;
	traducir = formFlash.traducir.value;
	
	if (formFlash.cdicategoria_aleatorio)
		cdicategoria_aleatorio = formFlash.cdicategoria_aleatorio.value;
	
	cdiconexion = formFlash.cdiconexion.value;
	
	var formdata = new FormData();		
		
	formdata.append('cdicurso', cdicurso);
	formdata.append('cdipermiso', cdipermiso);	
		
	var url_script = "php_script/info_test.php";
	
	$.ajax({
	   url : url_script,
	   type : 'POST',
	   data : formdata,
	   processData : false, 
	   contentType : false, 
	   success : function(res){
		   
			res = res.replace(/^\s+/g,'').replace(/\s+$/g,''); // hacemos un trim				
			//alert (res);
			
			if (!isNaN(res))
			{	
				document.FAbandonar.submit();
			}
			else
			{								
				if (id_curso == "CAP")
				{
					id_curso = "0";
					identificador_curso = "CAP";
				}
				else
				{
					if (id_curso == "FV")
					{
						id_curso = "1";
						identificador_curso = "FV";
					}
				}
				
				// Estas asignaciones son sólo para infotest
				if (formFlash.cdicategoria && formFlash.cditest)
				{
					nombre_test = formFlash.nombre_test.value;
					cdicategoria = formFlash.cdicategoria.value;
					cditest = formFlash.cditest.value;
					
					modo_infotest = true;
				}
				
				var tituloTest;				
				var imagenPermiso;
				var imagenTipoTest;
				
				if (modo_infotest)
				{
					//tituloTest = "Test de INFOTEST";
					tituloTest = "Test Predefinido";
					imagenTipoTest = "imagenes/icono_test_infotest.png";
					nombreTest = formFlash.nombre_test.value;
				}
				else
				{					
					if (parseInt(tipo_test) == 0)
					{						
						tituloTest = "Test Aleatorio";
							
						imagenTipoTest = "imagenes/icono_test_aleatorio.png";
						
						var nombre_categoria_aleatorio = formFlash.nombre_categoria_aleatorio.value;
						
						if (nombre_categoria_aleatorio == "")
							nombreTest = "Test Aleatorio (EXAMEN)";
						else
							nombreTest = "Test Aleatorio (" + nombre_categoria_aleatorio + ")";											
					}
					else
					{
						if (parseInt(tipo_test) == 1)
						{
							tituloTest = "Test Aleatorio";
							imagenTipoTest = "imagenes/icono_test_falladas.png";
							nombreTest = "Test de preguntas falladas";							
						}
					}
				}
				
				if (foto_alumno == "")
					foto_alumno = "../profesor/imagenes/icono_foto_profesor.jpg";	
			
				$("#nombre_de_alumno").html(nombre_alumno);	
				$("#titulo_test").html(tituloTest);	
				$("#total_preguntas_test").html(npreg);	
				
				var vector_info = res.split("*");
				var cadena = "";

				/*if (ayuda_alumno == "1")
				{
					cadena = "Ayuda: Sí - ";
				}
				else
				{
					cadena = "Ayuda: No - ";
				}
				if (premium_alumno == "1")
				{
					cadena += "Premium: Sí";
				}
				else
				{
					cadena += "Premium: No";
				}*/
				
				if (ayuda_pregunta == "1")
				{
					cadena = "Ayuda: Sí";
				}
				else
				{
					cadena = "Ayuda: No";
				}
				if (premium_alumno == "1")
				{
					cadena += "";
				}
				else
				{
					cadena += "";
				}
				if (autocorreccion_test == "1")
				{
					cadena +=  " - Correcci&oacute;n en modo estudio";
				}
				else
				{
					cadena += " - Correcci&oacute;n en modo examen";
				}
								
				cadena = "<span>&nbsp;" + nombreTest + "<br>&nbsp;" + vector_info[1] + "<br>&nbsp;" + vector_info[0] + "<br>&nbsp;" + cadena + "</span>";
				
				$("#cuerpo_intro_tema_titulo").html(cadena);
				
				cargaImagenesIntro(foto_alumno,0);
				
				function cargaImagenesIntro(ruta,indice)
				{
					var imagen = new Image();
										
					if (ruta != "") {
						
						imagen.src = ruta;
						
						$(imagen).on('load',function(){
											
							vectorImagenesIntro.push(imagen);					
							if (indice == 0)
							{
								if (logo_ae=="")			
									cargaImagenesIntro("../profesor/imagenes/logo_matfer.jpg",1);
								else
									cargaImagenesIntro(logo_ae,1);
							}
							else
							{
								if (indice == 1)
								{
									cargaImagenesIntro(imagenTipoTest,2);
								}
								else
								{
									if (indice == 2)
									{
										if (vector_info[2] != "")
										{										
											cargaImagenesIntro("../panel/permisos/adjuntos/thumb1/" + vector_info[2],3);
										}
										else
										{
											verIntro();
										}
									}
									else
									{
										verIntro();
									}
								}
							}
						}).error(function() {
							vectorImagenesIntro.push("");					
							if (indice == 0)
							{
								if (logo_ae=="")			
									cargaImagenesIntro("../profesor/imagenes/logo_matfer.jpg",1);
								else
									cargaImagenesIntro(logo_ae,1);
							}
							else
							{
								if (indice == 1)
								{
									cargaImagenesIntro(imagenTipoTest,2);
								}
								else
								{
									if (indice == 2)
									{
										if (vector_info[2] != "")
										{										
											cargaImagenesIntro("../panel/permisos/adjuntos/thumb1/" + vector_info[2],3);
										}
										else
										{
											verIntro();
										}
									}
									else
									{
										verIntro();
									}
								}
							}
						});
					}
				}
				
				// Hacemos el cambio a la pantalla de intro
				function verIntro(){
					
					// Este sería el sitio perfecto para hacer la PRECARGA DE LAS IMÁGENES DEL TEST
					// Usar un array como el de Darwin para las imágenes del menú principal
					
					// Tambien para inicializar el test
					inicializar_test();
					
					$("#cargando").animate({
						opacity: 0
					}, 500, 
					function(e){
						
						$("#imagen_logo_ae").attr("src",vectorImagenesIntro[1].src);
						if (vectorImagenesIntro[0] != "")
							$("#imagen_foto_alumno").attr("src",vectorImagenesIntro[0].src);	
						else
							$("#imagen_foto_alumno").attr("src","../profesor/imagenes/no_foto_pq.jpg");	
						$("#cuerpo_intro_titulo").css("background-image","url(" + vectorImagenesIntro[2].src + ")");
						if (vector_info[2] != "")
							$("#cuerpo_intro_tema").css("background-image","url(" + vectorImagenesIntro[3].src + ")");		
						
						$("#cargando").css("display","none");
						$("#intro").css("opacity",0).css("display","block");
						
						$("#boton_abandonar_test").unbind("click");
						$("#boton_abandonar_test").on("click",function(e) {							
							abandonar_flash('');	
						});
						
						$("#intro").animate({
							opacity: 1
						}, 500, 
						function(e){				
							cargar_preguntas(0);				
						});
					});
				}
			}							
	   },
	   error : function(res){
		   muestra_error(nombre_test);
	   }              
	});
}

function cargar_preguntas(indice)
{		
	if (indice < npreg)
	{		
		var formdata = new FormData();		
		
		formdata.append('cdipregunta', vpreg[indice]);
		formdata.append('identificacion', identificador_curso);	
		formdata.append('tipo_test', tipo_test);	

		var url_script = "";
		if (traducir == "0") {			
			url_script = "php_script/obtener_pregunta_fullscreen.php";
		} else {

			formdata.append('idioma', idiomaTraduccion);
			
			url_script = "php_script/obtener_pregunta_fullscreen_traducida.php";
		}
		
		$.ajax({
			url : url_script,
			type : 'POST',
			data : formdata,
			processData : false, 
			contentType : false, 
			success : function(res){
				
				res = res.replace(/^\s+/g,'').replace(/\s+$/g,''); // hacemos un trim				
				//alert (res);
				
				if (res=="error")
				{	
					muestra_error(nombre_test);
				}
				else
				{	
					if (res=="error_acceso_concurrente")
					{
						cerrar_conexion_concurrente();
					}
					else
					{
						var cadena = res.split("###");
	
						preguntas.push(res);
	
						if ((cadena[0].substr(0,7).toLowerCase() != "http://") && (cadena[0] != ""))
						{
							
							var imagen = new Image();

							var url_imagen = (parseInt(formFlash.test_propio.value) != 1) ? "../panel/preguntas/adjuntos/thumb1/" : url_google_drive;
							imagen.src = url_imagen + cadena[0];
													
							//imagen.src = "../panel/preguntas/adjuntos/thumb1/"+cadena[0];						
							
							$(imagen).on('load',function(){
								
								fotos_preguntas.push(imagen);				
								incrementarBarraProgreso();	
								indice++;						
								cargar_preguntas(indice);						
							}).error(function() {
							
								//fotos_preguntas.push(null);
								
								// Comprobamos si el nombre de la foto no tiene extensión JPG
								// En ese caso es muy probable que sea una foto de un test propio y la buscamos en Google Drive
								var vectorImagen = cadena[0].split(".jp");
								if (vectorImagen.length == 1)
								{
									url_imagen = url_google_drive;
									
									var imagenGD = new Image();
									imagenGD.src = url_imagen + cadena[0];
									
									$(imagenGD).on('load',function(){
										
										fotos_preguntas.push(imagenGD);				
										incrementarBarraProgreso();	
										indice++;						
										cargar_preguntas(indice);
									}).error(function() {	
									
										fotos_preguntas.push(null);
										incrementarBarraProgreso();
										indice++;
										cargar_preguntas(indice);
									
									});
								}
								else
								{
									fotos_preguntas.push(null);
									incrementarBarraProgreso();
									indice++;
									cargar_preguntas(indice);
								}
							});
						}
						else
						{							
							
							fotos_preguntas.push(null);
							incrementarBarraProgreso();
							indice++;
							cargar_preguntas(indice);
						}
					}
				}				
			},
		   	error : function(res){
			  	//muestra_error(nombre_test);
		   	}              
		});
	}
	else
	{	
		
		// MOD 23/10
		
		// Precargamos todos los graficos necesarios para poder hacer el test sin conexión a Internet
			
		/*$("#texto_mensaje_pantallazo").css("text-align","center");
		$("#linea_botones_pantallazo").css("display","none");
		$("#texto_mensaje_pantallazo").html("configurando test ...");
		$("#pantallazo_mensajes").css("display","block");*/
		
		$("#texto_cargando_elementos").html("Configurando test ...");
		if (document.getElementById("p_traduccion")) {
			$("#p_traduccion").html("<span>Traducci&oacute;n completada.</span>");
		}
		
		var graficos = new Array(
		
		'imagenes/logo_matferline_html5.png',		
		'imagenes/pregunta_letra_a.png',
		'imagenes/pregunta_letra_b.png',
		'imagenes/pregunta_letra_c.png',
		'imagenes/pregunta_letra_d.png',
		'imagenes/pregunta_letra_acierto.png',
		'imagenes/pregunta_letra_error.png',
		'imagenes/pregunta_letra_ok.png',
		'imagenes/pregunta_letra_no_contestada.png',
		'imagenes/base_numero_pregunta.png',
		'imagenes/base_numero_pregunta_acertada.png',
		'imagenes/base_numero_pregunta_acertada_over.png',		
		'imagenes/base_numero_pregunta_contestada.png',
		'imagenes/base_numero_pregunta_fallada.png',
		'imagenes/base_numero_pregunta_fallada_over.png',
		'imagenes/base_numero_pregunta_over.png',
		'imagenes/icono_idioma_castellano.png',
		'imagenes/icono_pregunta_adelante_test.png',
		'imagenes/icono_pregunta_atras_test.png',
		'imagenes/icono_ayuda_test.png',
		'imagenes/icono_finalizar_test.png',
		'imagenes/icono_corregir_test.png',
		'imagenes/bolita_test_apto.png',
		'imagenes/bolita_test_no_apto.png',
		'imagenes/bolita_test_preguntas_falladas.png',
		'imagenes/icono_flecha_arriba_numeros_preguntas.png',
		'imagenes/icono_flecha_abajo_numeros_preguntas.png'
		
		);
		
		var indice_graficos = 0;
		if (graficos.length > 0)
			precargar_graficos(indice_graficos);
		
		function precargar_graficos(indice)
		{
			var imagen = new Image();
			imagen.src = graficos[indice];
			
			$(imagen).on('load',function(){
				//alert("anchura: " + imagen.width);
				indice_graficos++;
				if (indice_graficos<graficos.length)
				{
					precargar_graficos(indice_graficos);
				}
				else
				{


					// Si es un test propio, usamos el logo de la AE en la pantalla del test					
					if (formFlash.test_propio)
					{
						if (parseInt(formFlash.test_propio.value) == 1)
						{
							
							var rutaLogo = $("#imagen_logo_ae").attr("src");							

							$(".test_cuerpo_columnas_izq").css("background-image","url(" + rutaLogo + ")");
							//$(".test_cuerpo_columnas_izq").css("opacity","0.5");							
						}
					}


					preparar_inicio_test();
				}
			});
		}	
		
		function preparar_inicio_test()
		{	
			
			// Recuperamos la variable de sesión $_SESSION["CTA"] y la almacenamos en cadena_respuestas_correctas
			// Esto lo hacemos para tener las respuestas almacenadas por si a la hora de corregir el servidor no devuelve ok
			// que podamos mostrar los resultadosm correctos, aunque no se haya grabado el test en BDatos.
			
			var formdata = new FormData();	
			
			formdata.append('cdipermiso', cdipermiso);	
				
			var url_script = "php_script/obtener_CTA_num_fallos.php";
			
			$.ajax({
				url : url_script,
				type : 'POST',
				data : formdata,
				processData : false, 
				contentType : false, 
				success : function(res){
					
					res = res.replace(/^\s+/g,'').replace(/\s+$/g,''); // hacemos un trim				
					//alert (res);
					
					var auxiliar = res.split("*");
					num_fallos_permiso = auxiliar[1];
					
					cadena_respuestas_correctas = auxiliar[0];				
					
					cargar_botones_iniciar_test();
								
				},
				error : function(res){
					cargar_botones_iniciar_test();
				}              
			});	
			
			function cargar_botones_iniciar_test()
			{
				//ocultaPantallazo();
				
				$("#texto_cargando_elementos").html("Test cargado con &eacute;xito");
				
				$("#boton_realizar_test").removeClass("boton_intro_off").addClass("boton_intro");
			
				$("#boton_realizar_test").unbind("click");		
				$("#boton_realizar_test").on("click",function(e){
					
					fullScreen();
					
					$("#intro").animate({
						opacity: 0
					}, 500, 
					function(e){
						$("#intro").css("display","none");
						$("#test").css("opacity",0).css("display","block");
						
						iniciar_test();
						
						$("#test").animate({
							opacity: 1
						}, 500,
						function(e){
							
						});
					});
					
				});

				// Para alumnos profe web monitorizados
				if (sessionStorage.getItem("spwm")) {

					var cdisesion = sessionStorage.getItem("spwm");

					var formdata = new FormData();		
				
					if (formdata)
					{					
						formdata.append('cdisesion', cdisesion);								
					}		
					
					mensaje_cargador("validando ...",1);
					var url_script = "php_script/check_authenticator.php";
					
					if(formdata){
						$.ajax({
							url : url_script,
							type : 'POST',
							data : formdata,
							processData : false, 
							contentType : false, 
							success : function(res){

								res = res.replace(/^\s+/g,'').replace(/\s+$/g,''); // hacemos un trim

								mensaje_cargador("",0);		
								
								if (res == "ok") {
									crearTimeOutValidacion(cdisesion);
									crearTimeOutTiempoSesion();
								} 
							},
							error : function(res){
								mensaje_cargador("",0);
								alert("No se ha podido realizar la validación de la monitorización. Si el problema persiste póngase en contacto con su Autoescuela.");
							}              
						});
					}
				}
			}
		}
	}
	
	function incrementarBarraProgreso()
	{		
		$("#num_pregunta_test").text(indice + 1);
		
		var anchura = $("#base_barra_cargador").width();		
		var pasos = Math.floor(anchura / npreg);
		
		pasos = (anchura * indice) / npreg;
		
		if (indice == (npreg - 1))
			$("#barra_cargador").width(anchura);
		else
			$("#barra_cargador").width(pasos);
	}
}

function inicializa(cadena,ayuda,autocorreccion,idcurso,el_tipo_test,idioma)
{
	
	$("img").on("mousedown",function(e)
	{
		e.stopPropagation();
		e.preventDefault();
	});
	
	document.body.style.backgroundColor = "#E2E9E9";
	
	id_curso = idcurso;	
	cadena_pregunta = cadena;
	ayuda_pregunta = ayuda;
	autocorreccion_test = autocorreccion
	tipo_test = el_tipo_test;
	idioma_permiso = idioma;
	
	formFlash = document.FFlash;
	cargarTest();			
		
}

$(document).ready(function(){
    $(this).bind("contextmenu", function(e) {
        e.preventDefault();
    });
});

//window.onload = inicializa;


