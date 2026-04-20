// JavaScript Document
var acceso_rapido_lista_ae= "";

function validar_ae()
{
	var form = document.form_acceso_rapido;
	
	if (form.acceso.value == "")
	{
		muestra_mensaje_servidor("../imagenes/img_mensaje_error.png","Escribe tu clave de acceso rápido.");
		form.acceso.focus();
	}
	else
	{	
		if (acceso_rapido_lista_ae!="")
		{
			$("#pantallazo").css("display","none");
			muestra_mensaje_alert(1,"ATENCIÓN: Elige tu autoescuela.","żQuieres usar " + form.nombre.value + " como tu autoescuela?","boton_lista_aes");
		}
		else
		{
			abrir_ae();
		}
	}
}

function abrir_ae ()
{
	var form = document.form_acceso_rapido;	
	var formdata = new FormData();		
		
	if (formdata)
	{
		formdata.append('acceso', form.acceso.value);								
	}
	
	var url_script = "";			
	
	mensaje_cargador("accediendo ...",1);
	url_script = "php_script/validar_ae.php";
	
	if(formdata){
		$.ajax({
		   url : url_script,
		   type : 'POST',
		   data : formdata,
		   processData : false, 
		   contentType : false, 
		   success : function(res){
			   
				res = res.replace(/^\s+/g,'').replace(/\s+$/g,''); // hacemos un trim
				
				//alert (res);
				mensaje_cargador("",0);
				
				if (!isNaN(res))
				{
					muestra_mensaje_servidor("../imagenes/img_mensaje_error.png","Acceso rápido incorrecto.");
				}
				else
				{								
					if (acceso_rapido_lista_ae=="")
					{
						$("#pantallazo").css("display","none");
						muestra_mensaje_alert(1,"ATENCIÓN: Elige tu autoescuela.","żQuieres usar " + res + " como tu autoescuela?","boton_acceso_rapido");						
					}
					else
					{
						location.href = "../alumno";
					}
				}							
		   },
		   error : function(res){
			   mensaje_cargador("",0);
			   alert("No se ha podido comprobar el acceso rápido. Inténtelo de nuevo y si el problema persiste póngase en contacto con Ediciones MATFER.");
		   }              
		});
	}
}

function listado_aes_provincia(nombre_provincia)
{	
	var formdata = new FormData();		
	
	if (formdata)
	{
		formdata.append('provincia', nombre_provincia);								
	}
	
	var url_script = "";			
	
	mensaje_cargador("cargando datos ...",1);
	url_script = "php_script/listado_aes.php";
	
	if(formdata){
		$.ajax({
		   url : url_script,
		   type : 'POST',
		   data : formdata,
		   processData : false, 
		   contentType : false, 
		   success : function(res){
			   
				res = res.replace(/^\s+/g,'').replace(/\s+$/g,''); // hacemos un trim
				
				//alert (res);
				mensaje_cargador("",0);
				
				if (!isNaN(res))
				{
					muestra_mensaje_servidor("../imagenes/img_mensaje_error.png","No se han encontado autoescuelas en la Provincia de " + nombre_provincia + ".");
				}
				else
				{								
					var nombre_provincia_en_pantalla = nombre_provincia;
					if (nombre_provincia.toLowerCase() == "santander") 
						nombre_provincia_en_pantalla = "Cantabria";
					
					document.getElementById("cabecera_lista_aes_titulo").innerHTML = "Provincia de " + nombre_provincia_en_pantalla;
					document.getElementById("lista_aes").innerHTML = res;
					
					$("#pantallazo").css("display","block");
					if(document.getElementById("lista_aes").offsetHeight > screen.availHeight)
					{
						$("#contenedor_general").addClass("fondo_web_fijo");	
					}
				}							
		   },
		   error : function(res){
			   mensaje_cargador("",0);
			   alert("No se ha podido comprobar el acceso rápido. Inténtelo de nuevo y si el problema persiste póngase en contacto con Ediciones MATFER.");
		   }              
		});
	}
}

function cargar_acceso_rapido(acceso_rapido,nombre)
{
	var form = document.form_acceso_rapido;
	form.acceso.value = acceso_rapido;	
	form.nombre.value = nombre;	
	
	acceso_rapido_lista_ae = "ok";
	
	validar_ae();
}

function stopRKey(evt) 
{
	var evt = (evt) ? evt : ((event) ? event : null);
	var node = (evt.target) ? evt.target : ((evt.srcElement) ? evt.srcElement : null);
	if ((evt.keyCode == 13) && ((node.type=="text") || (node.type=="password")))
	{
		switch (node.id)
		{
			case "acceso":
				
				validar_ae();
				
			break;
		}
		return false;
	}
}
document.onkeypress = stopRKey;

function comprueba_ae()
{
	if (localStorage.getItem("acceso_rapido_ae"))
	{
		
		var form = document.form_acceso_rapido;	
		var formdata = new FormData();		
			
		if (formdata)
		{
			formdata.append('acceso', localStorage.getItem("acceso_rapido_ae"));								
		}
		
		var url_script = "";			
		
		url_script = "php_script/validar_ae.php";
		
		if(formdata){
			$.ajax({
			   url : url_script,
			   type : 'POST',
			   data : formdata,
			   processData : false, 
			   contentType : false, 
			   success : function(res){
				   
					res = res.replace(/^\s+/g,'').replace(/\s+$/g,''); // hacemos un trim
					
					//alert (res);
					mensaje_cargador("",0);
					
					if (!isNaN(res))
					{
						muestra_mensaje_servidor("../imagenes/img_mensaje_error.png","Acceso rápido incorrecto.");
					}
					else
					{	
						location.href = "../alumno";
					}							
			   },
			   error : function(res){
				   $("#contenedor_general").css("display","block");
				   //mensaje_cargador("",0);
				   //alert("No se ha podido comprobar el acceso rápido. Inténtelo de nuevo y si el problema persiste póngase en contacto con Ediciones MATFER.");
			   }              
			});
		}
	}
	else
	{
		$("#contenedor_general").css("display","block");
	}
}

$(function()
{
	
	if(!window.FormData) {
		location.href="aviso_navegador.htm";
	}
	else
	{	
		comprueba_ae();
		
		estira_pie();
		
		elige_personaje();
		
		/* CODIGO BOTON ACCESO RAPIDO */
		$("#boton_entrar").on("click",function(e)
		{
			validar_ae();
		});	
		
		/* CODIGO BOTONES PROVINCIAS */
		$("area").on("mouseover",function(e)
		{
			$("#contenedor_mapa_nombre_provincia").text(this.title);
		}).on("mouseout",function(e){
			$("#contenedor_mapa_nombre_provincia").text("Elige tu provincia");	
		}).on("click",function(e)
		{
			
			var id_provincia = e.target.id;
			var numero_provincia = id_provincia.substring(id_provincia.lastIndexOf("_")+1,id_provincia.length);
			//alert(numero_provincia);
			
			listado_aes_provincia(numero_provincia);
		});
		
		/* CODIGO LISTA AES */
		$("#cabecera_lista_aes_boton").on("click",function(e)
		{
			$("#pantallazo").css("display","none");	
			$("#contenedor_general").removeClass("fondo_web_fijo");		
		});
		
		document.getElementById("acceso").focus();
	}
});

function elige_personaje()
{
	var numero = Math.ceil(Math.random()*2);
	var imagen = "imagenes/perso_"+ numero + ".png";
	
	$("#bloque_personajes img").attr("src",imagen);
}

function estira_pie()
{
	var altura_pie = $("#footer").height();
	var diferencia_altura = $(document).innerHeight()-$("#contenedor_general").height();
	
	altura_pie += diferencia_altura;
	$("#footer").height(altura_pie);	
}