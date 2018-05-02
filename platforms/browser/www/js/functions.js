const ROOT_ID = "177776";
const EMAIL_SYSTEM = "contato@estacaosaude.com.br";

$(document).bind('pageinit', function(event){
  $('.ui-link').removeClass('ui-link');

  $('ul.tabs').tabs({swipeable: true});

  // Colocando o cashback na tela inicial
  allBalanceOption('20', '', '', 'add');

  $(window).on("navigate", function (event, data) {
    var direction = data.state.direction;
    if (direction == 'back') {
      $('select.client-city option').remove();
      $('#modal-lomadee').modal('close');
      $('#modal-confirm').modal('close');
      // $('#est-content').css('opacity', '0');
      $('#est-content .card-img-logo img').attr('src', '');
    }
  });

  // removing the ui classes
  $('.ui-btn').removeClass('ui-btn ui-shadow ui-corner-all');
});

$(document).ready(function(){

  $('select').material_select();
  $('.modal').modal();

  // Se existir informação no banco de dados direcionar para a pagina principal
  // Senão jogar para a tela de login
  readFromDB(function(dbInfo){
    if (navigator.onLine) {
      if (dbInfo != '') {
        // Tem internet
        window.location.replace('#pageone');
        LoadBranch();
        returnCustomer();
        loadBalance();
        allBalance();
        allBalanceEconomy();

        // Setando texto nas input de login
        $('#login-username').val(dbInfo.customer_info);
        $('#user-login-group label').addClass('active');

        $('#login-pass').val(dbInfo.customer_pswd);
        $('#pass-login-group label').addClass('active');
      }
    } else {
      // Não tem internet
       window.location.replace('#login');
    }
  });

  // Evento q atualiza os dados do cliente
  $('#update-user-info').click(function(){
    updateCustomer();
  });

  // Evento q puxa as cidades de acordo com o estado
  $('.client-uf').change(function(){
    createCities(getUfByNum($(this).val()), '');
  });
});

// Contador que serve para saber se vai ou não direcionar para a pagina de login
var redirect_i = 0;

// Verifica a conexão a cada 3 segundos
window.setInterval(function(){
  var connection = testeConnection();
  if (connection == true) {
    // Zerando contador se a conexãor
    redirect_i = 0;
    $('.no-connection').hide();
  } else {
    // Se o contador estiver zerado, direcionar para a pagina de login
    if (redirect_i <= 1) {
      window.location.replace('#login');
      $('.no-connection').show();
    }
  }

  // Somando mais um no contador
  redirect_i++;
}, 2000);

// Função que teste se está com ou sem internet
function testeConnection() {

  if (navigator.onLine) {
    // Faz nada pq ta conectado com a internet
    return true;
  } else {
    return false;
  }
}

// Função que pega o userId e PassWord
function getUserID(callback) {
  $.support.cors = true;

  /*
    * Parâmetros
      - RootID: Passado manualmente. NEste código está no topo da pagina como uma constante chamada ROOT_ID
      - PSWD: Valor fixo
      - ResponseType: 1 para json e 2 para xml
  */

  $.ajax({
    url: 'http://rest.genxpression.com/GenXpressionWSRest/MyLogSimple',
    type: 'POST',
    data: {RootID:ROOT_ID, PSWD:'54548@#skeijSDF​', ResponseType: "1"},
    dataType: 'json',
    success: function(data) {
      $.each(data, function(index, value) {
        if (value.RequestStatus == "Success") {
          if (index == 0) {
            var arr_user = [value.UserID, value.PassWord];
            callback(arr_user);
          }
        } else {
          callback("");
        }
      });
    },
    error: function() {
      $('#login #login-load').hide('fast');
      window.location.replace('#login');
      // alert('Erro. Tente novamente mais tarde.');
    }
  });
}

// Função que monta todos os estabelecimentos
function LoadBranch() {
  $.support.cors = true;

  getUserID(function(returnUserID){
    $.ajax({
      url: 'http://rest.genxpression.com/GenXpressionWSRest/LoadBranch',
      type: 'POST',
      data: {UserID:returnUserID[0], Pass:returnUserID[1], ResponseType: "1"},
      dataType: 'json',
      beforeSend: function() {
        $('#estabelecimentos .loading-div').show();
        $('#estabelecimentos .ajax-loading').addClass('active');
      },
      success: function(data) {

        var arrBranch = [];

        $.each(data, function(index, value) {
          if (value.RequestStatus == "Success") {
            arrBranch.push(value.CompanyFantasy + ';' + value.BranchID);
          }
        });

        // Arrumando o array
        arrBranch.sort();

        $.each(arrBranch, function(index, value){
          // Separando o BranchID e o nome da companhia
          var arr_Branch_split = value.split(';');

          var arrColors = getMyIconAndColor(arr_Branch_split[0]);

          

          $('#est-ul').append(
            '<a href="#est-det" data-transition="slide" id="' + arr_Branch_split[1] + '"><li class="collection-item avatar">' +
            '<i class="circle ' + arrColors[1] + ' fa fa-' + arrColors[0] + ' collection-icon collection-icon-branch"></i>' +
            '<span class="title grey-text text-darken-2 branch-name">' + arr_Branch_split[0] + '</span>' +
            '<p style="color: rgba(0,0,0,0.71);">Clique para conhecer este credenciado</p>' +
            '<a href="#est-det" class="secondary-content" data-transition="slide" id="' + arr_Branch_split[1] + '"><i class="fa fa-ellipsis-v"></i></a>' + 
            '</li></a>'
          );

        });
      },
      error: function() {
        openAlert('Erro ao carregar todos os estabelecimentos', 'Ops', '', '');
      }
    }).complete(function() {
      $('#estabelecimentos .loading-div').hide();
      $('#estabelecimentos .ajax-loading').removeClass('active');
      // Função que coloca a lista em ordem alfabetica
      $('#est-ul').show('fast');
    });
  });
}

// Função que monta os dados do estabelecimento
function readBranch() {
  $.support.cors = true;

  var branchId = $('.branch-id-input').val();

  getUserID(function(returnUserID){

    $.ajax({
      url: 'http://rest.genxpression.com/GenXpressionWSRest/ReadBranch',
      type: 'POST',
      data: {BranchID: branchId, UserID: returnUserID[0], PSWD: returnUserID[1], ResponseType: "1"},
      dataType: 'json',
      beforeSend: function() {
        $('#est-det .loading-div').show();
        $('#est-det .ajax-loading').addClass('active');
      },
      success: function(data) {
        $.each(data, function(index, value) {
          
          if (value.RequestStatus == "Success") {
            // Montando logo
            if (value.LogoPath != null) {
              $('#est-det .card-img-logo img').attr('src', value.LogoPath);
            } else {
              $('#est-det .card-img-logo img').attr('src', 'img/no-logo.png');
            }

            // Montando o desconto
            $.ajax({
              url: 'http://rest.genxpression.com/GenXpressionWSRest/RetrieveBranchSimpleRules',
              type: 'POST',
              data: {RootID: value.RootID, BranchID: value.BranchID, UserID: returnUserID[0], PSWD: returnUserID[1]},
              success: function(data2) {

                $.each(data2, function(index2, value2){
                  if (value2.RequestStatus == "Success") {

                    $('.here-is-discount').html(
                      '<a href="#" class="btn-floating btn-large btn-price waves-effect waves-light pink accent-2">' + value2.Percentual * 100 + '%' + '</a>'
                    );
                  }
                });
              }
            });
            // Fim ajax de desconto

            // Montanto site do estabelecimento
            if (value.WebSite != null) {
              var strstr = value.WebSite.indexOf("*");
              var webSite;
              // Se tiver "*" no campo website
              if (strstr > -1) { // Nesse caso tem o site e o mapa
                // Quebrando a string em dois
                var arr_Site = value.WebSite.split('*');
                // Separando a latitude da longitude
                var arr_Map = arr_Site[1].split(';');

                // Colocando o site
                webSite = 'http://' + arr_Site[0];
                $('#est-det .princ-card p a').attr('data-site', webSite);
                $('#est-det .princ-card p a').attr('onclick', 'openBrowser("offer", $(this))');
                $('#est-det .princ-card p a').html(arr_Site[0]);
                $('#est-det .princ-card p a').removeClass();
                // Colocando o mapa
                $('#est-det .map-card .card-image').css('height', '300px');
                $('#est-det .map-card .card-image').html('<div id="map-canvas"></div>');
                // Executando função do Google maps para atualizar
                iniMapizinho(arr_Map[0], arr_Map[1]);
                google.maps.event.addDomListener(window, "resize", function() {
                  var center = map.getCenter();
                  google.maps.event.trigger(map, "resize");
                  map.setCenter(center);
                });
              } else { // Nesse caso tem só o site
                // Colocando o site
                webSite = 'http://' + value.WebSite;
                $('#est-det .princ-card p a').attr('data-site', webSite);
                $('#est-det .princ-card p a').attr('onclick', 'openBrowser("offer", $(this))');
                $('#est-det .princ-card p a').html(value.WebSite);
                $('#est-det .princ-card p a').removeClass();
              }
            } else {
              // Dizendo que o mapa é vazio
              $('#est-det .map-card .card-image').html('<h4 class="card-title-new grey-text text-darken-4">Sem mapa cadastrado</h4>');
              $('#est-det .map-card .card-image').css('height', 'auto');
              $('#map-canvas').remove();
              // Dizendo que o site é vazio
              $('#est-det .princ-card p a').html("Sem Website");
              // Deixando nulo o data-site do site para não direcionar para o parceiro anterior
              $('#est-det .princ-card p a').attr('data-site', 'undefined');
            }

            // Montando nome do estabelecimento no cabeçalho
            $('#est-det .brand-logo').html(value.CompanyFantasy);
            // Montando nome do estabelecimento no card
            $('#est-det .princ-card .card-title').html(value.CompanyFantasy);

            // Montando endereço
            var ad_var = "";
            if (value.AddressLine1 != null) {
              ad_var += '<h4 class="card-title grey-text text-darken-4">' + value.AddressLine1 + "</h4>";
            }
            if (value.AddressLine2 != null) {
              ad_var += value.AddressLine2 + "<br/>";
            }
            if (value.Neighborhood != null) {
              ad_var += value.Neighborhood + " - ";
            }
            if (value.City != null || $.trim(value.City) == "-") {
              ad_var += value.City + " - ";
            }
            if (value.State != null || $.trim(value.State) == "-") {
              ad_var += value.State + "<br/>";
            }
            if (value.PostalCode != null) {
              ad_var += "CEP " + value.PostalCode;
            }
            if (ad_var != "") {
              $('#est-det #ad-card').html(ad_var);
            } else {
              $('#est-det #ad-card').html('<h4 class="card-title grey-text text-darken-4">Sem Registro</h4>');
            }

            // Montando o telefone
            var tel_var = "";
            $('#est-det #tel-card').html("");

            if (value.Phone != null) {
              tel_var += value.Phone;
              $('#est-det #tel-card').append('<h3 class="card-title grey-text text-darken-4">Telefone:</h3>');
              $('#est-det #tel-card').append('<h4 class="card-title grey-text text-darken-4">' + value.Phone + '</h4>');

              // Colocando a mascara no telefone              
              if (value['Phone'].length >= 10) {
                $('#est-det #tel-card h4').mask('(00) 0000-0000');
              } else {
                $('#est-det #tel-card h4').mask('0000-0000');
              }
            }

            if (value.Mobil != null) {
              tel_var += value.Mobil;
              $('#est-det #cel-card').append('<h3 class="card-title grey-text text-darken-4">Celular:</h3>');
              $('#est-det #cel-card').append('<h4 class="card-title grey-text text-darken-4">' + value.Mobil + '</h4>');

              // Colocando a mascara no celular
              if (value['Mobil'].length >= 11) {
                $('#est-det #cel-card h4').mask('(00) 00000-0000');
              } else {
                $('#est-det #cel-card h4').mask('00000-0000');
              }
            }
            // Escrever "Sem Registro" se não tiver o endereço
            if (tel_var == "") {
              $('#est-det #tel-card').html('<h4 class="card-title grey-text text-darken-4">Sem Registro</h4>');
            }

          }
        });

        $('#est-content').css('opacity', '1');
        $('#est-content').css('visibility', 'visible');
      },
      error: function() {
        openAlert("Erro ao carregar o estabelecimento.", 'Ops', '', '');
      },
    }).complete(function() {
      $('#est-det .loading-div').hide();
      $('#est-det .ajax-loading').removeClass('active');
    });
  });
}

// Função que monta os dados da conta do cliente final
function returnCustomer() {
  $.support.cors = true;

  // geting the cookies and insiding into a array
  var userInfo = {
      'customer_info': getStorage("customer_info"),
      'customer_pswd': getStorage("customer_pswd"),
      'info_type': getStorage("info_type"),
      'product_id': getStorage("product_id"),
      'row_id': '1',
  }

  getUserID(function(userIdInfo){
    $.ajax({
      url: 'http://rest.genxpression.com/GenXpressionWSRest/ReturnCustomer',
      type: 'POST',
      data: {MyCustomer: userInfo.customer_info, InfoType: userInfo.info_type, CustomerPSWD: userInfo.customer_pswd, UserID: userIdInfo[0], PSWD: userIdInfo[1], ResponseType: "1"},
      dataType: 'json',
      beforeSend: function() {
        $('#conta .loading-div').show();
        $('#conta .ajax-loading').addClass('active');
      },
      success: function(data) {
          
        $.each(data, function(index, value) {
          if (value.RequestStatus == "Success") {
            // Gerando variavel de avatar
            var photo_cliente = 'img/user-no-img.jpg';
            if (value.ImagePath != null) { // Esse é o link da imagem padrão
              photo_cliente = value.ImagePath;
            }

            // Gerando variável de nome
            var name_cliente = '';
            if (value.FirstName != null) {
              name_cliente = value.FirstName + ' ';
            }
            var sName_client = '';
            if (value.MiddleName != null) {
              sName_client += value.MiddleName + ' ';
            }
            if (value.LastName != null) {
              sName_client += value.LastName;
            }

            // Gerando variável de email
            var mail_cliente = '';
            if (value.PersonalEmail != null) {
              mail_cliente = value.PersonalEmail;
            }

            // Gerando variável do sexo
            var gender_cliente = '';
            if (value.Gender != null) {
              gender_cliente = value.Gender;
            }

            // Gerando variável do nascimento
            var birth_cliente = '';
            if (value.Birthday != null) {
              birth_cliente = value.Birthday;
            }

            // Gerando variável da nacionalidade
            var country_cliente = '';
            if (value.Country != null) {
              country_cliente = value.Country;
            }

            // Gerando variável do cpf
            var cpf_cliente = '';
            if (value.PersonalID != null) {
              cpf_cliente = value.PersonalID;
            }

            // Gerando variável do rg
            var rg_cliente = '';
            if (value.PersonalSecondID != null) {
              rg_cliente = value.PersonalSecondID;
            }

            // Gerando variável de endereço
            var ad1_cliente = '';
            if (value.AddressLine1 != null) {
              ad1_cliente = value.AddressLine1;
            }

            var nei_cliente = '';
            if (value.Neighborhood != null) {
              nei_cliente = value.Neighborhood;
            }

            // estado
            var uf_cliente = '';
            if (value.Region != null) {
              uf_cliente = value.Region;
            }

            // cidade
            var city_cliente = '';
            if (value.City != null) {
              city_cliente = value.City;
            }

            // Complemento
            var ad2_cliente = '';
            if (value.AddressLine2 != null) {
              ad2_cliente = value.AddressLine2;
            }

            // CEP
            var cep_cliente = '';
            if (value.Zipcode != null) {
              cep_cliente = value.Zipcode;
            }

            // Tel
            var tel_cliente = '';
            if (value.  Homephone != null) {
              tel_cliente = value.Homephone;
            }

            // Cel
            var cel_cliente = '';
            if (value.Mobil != null) {
              cel_cliente += value.Mobil;
            }

            // ----------------- Adicionando as variaveis nos campos

            // Photo
            $('#mypic').attr('src', photo_cliente);

            // Name
            $('#client-name-1, .client-name-1').val(name_cliente + ' ' + sName_client);
            $('#client-name-panel').html(name_cliente);
            $('#princ-card-p').hide().html('Seja Bem-vindo, ' + '<span>' + value.FirstName + '</span>').slideDown(500);
            if (name_cliente != "") {
              $('#client-name-div label').addClass('active');
            }

            // E-mail
            $('#client-mail, .client-mail').val(mail_cliente);
            if (mail_cliente != "") {
              $('#client-mail-div label').addClass('active');
            }

            // gender
            $('#client-gender, .client-gender').val(gender_cliente);
            if (gender_cliente != "") {
              $('#client-gender-div label').addClass('active');
            }

            // cpf
            $('#client-cpf, .client-cpf').val(cpf_cliente);
            if (cpf_cliente != "") {
              $('#client-cpf-div label').addClass('active');
            }

            // birth
            $('#client-date, .client-date').val(birth_cliente);

            // rg
            $('#client-rg, .client-rg').val(rg_cliente);

            // country
            $('#client-country, .client-country').val(country_cliente);

            // Ad1
            $('#client-cep, .client-cep').val(cep_cliente);
            if (cep_cliente != "") {
              $('#client-cep-div label').addClass('active');
            }

            // Ad1
            $('#client-ad1, .client-ad1').val(ad1_cliente);
            if (ad1_cliente != "") {
              $('#client-ad1-div label').addClass('active');
            }

            // Nei
            $('#client-nei, .client-nei').val(nei_cliente);
            if (nei_cliente != "") {
              $('#client-nei-div label').addClass('active');
            }

            // UF
            
            $('#client-uf').val(getUfByNum(uf_cliente));
            $('#client-city-panel').html(getUfByNum(uf_cliente));
            if (uf_cliente != "") {
              $('#client-uf-div label').addClass('active');
            }

            // Carregando a cidade
            if (city_cliente != '') {
              createCities($('#client-uf').val(), city_cliente);
            }                    

            // Ad2
            $('#client-ad2, .client-ad2').val(ad2_cliente);
            if (ad2_cliente != "") {
              $('#client-ad2-div label').addClass('active');
            }

            // Tel
            $('#client-tel, .client-tel').val(tel_cliente);
            if (tel_cliente != "") {
              $('#client-tel-div label').addClass('active');
              $('#client-tel').mask('(00) 0000-0000'); // Mascara
            }

            // Cel
            $('#client-cel, .client-cel').val(cel_cliente);
            if (cel_cliente != "") {
              $('#client-cel-div label').addClass('active');
              $('#client-cel').mask('(00) 00000-0000'); // Mascara
            }
          }

        });

        $('select.client-uf, select#client-uf').material_select();
      }
    }).complete(function() {
      $('#conta .loading-div').hide();
      $('#conta .ajax-loading').removeClass('active');
      $('#conta-div').show('fast');
    });

  });
}

// Função que monta o saldo de pontos
function loadBalance() {
  $.support.cors = true;

  getUserID(function(userIdInfo){
    readFromDB(function(dbInfo){
      $.ajax({
        url: 'http://rest.genxpression.com/GenXpressionWSRest/RetrieveReadyToUseBalance',
        type: 'POST',
        data: {MyCustomer: dbInfo.customer_info, InfoType: dbInfo.info_type, UserID: userIdInfo[0], PSWD: userIdInfo[1], PID: dbInfo.product_id, ResponseType: 1},
        dataType: 'json',
        success: function(data) {
          $.each(data, function (index, value) {
            if (value.RequestStatus == "Success") {
              $('#princ-card-title').hide().html(addCommas(value.Valor) + ' <small class="second-color-text">Pontos</small>').fadeIn(3000);
            } else {
              alert('Não foi possível carregar os pontos.');
            }
          });
        },
        error: function() {
          alert('Não foi possível carregar os pontos.');
        }
      });
    });
  });
}

// Função que monta o extrato de pontos
function allBalance() {
  $.support.cors = true;

  getUserID(function(userIdInfo){
    readFromDB(function(dbInfo){
      returnMyCustomerInArray(function(customerInfo){
        $.ajax({
          url: 'http://rest.genxpression.com/GenXpressionWSRest/AllBalanceOption',
          type: 'POST',
          data: {CustomerID: customerInfo[0], PID: dbInfo.product_id, BranchID: '0', Range1: '', Range2: '', QueryType: '13', UserID: userIdInfo[0], PSWD: userIdInfo[1], ResponseType: "1"},
          dataType: 'json',
          beforeSend: function() {
            $('#extratos .loading-div').show();
            $('#extratos .ajax-loading').addClass('active');
          },
          success: function(data) {
            $.each(data, function(index, value){
              if (value.RequestStatus == "Success") {
                var ext_id = '';
                var ext_date = '-';
                var ext_local = '-';
                var ext_pts = '-';

                // Verificando se o id não é vazio
                if (value.ID != null) {
                  ext_id = value.ID;
                }

                // Verificando se a data não é vazia
                if (value.Data != null) {
                  ext_date = value.Data;
                }

                // Verificando se o local não é vazio
                if (value.Local != null) {
                  ext_local = value.Local;
                } else if (value.Local == 'Admin') {
                  ext_local = "Administrativo";
                }

                // Verificando se os pontos não estão vazios
                if (value.Pontos != null) {
                  ext_pts = value.Pontos;
                }

                // Construindo e inserindo as variáveis na tabela de extrato
                $('#extratos .extract-table').append(
                  '<a href="#!" class="collection-item '+ext_id+'">\
                  <span class="badge">'+ext_date+'</span><span style="font-size: 14pt;">'+addCommas(ext_pts)+' pontos</span><br/>'+ext_local+'</a>'
                );

              } else {
                if (value.Local == "") {
                  $('#extratos .extract-table').append(
                    '<a href="#!" class="collection-item">\
                    <span class="badge"></span><span style="font-size: 14pt;">Nenhum registro encontrado</span></a>'
                  );
                } else {
                  alert('Não foi possível alguma parte do extrado de pontos.');
                }
              }
            });
          },
          error: function() {
            alert('Não foi possível carregar o extrato de pontos.');
          }

        }).complete(function() {
          $('#extratos .loading-div').hide();
          $('#extratos .ajax-loading').removeClass('active');
          $('#extratos .extract-table').show('fast');
        });
      });
    });
  });
}

// Função que monta o extrato de pontos
function allBalanceEconomy() {
  $.support.cors = true;

  getUserID(function(userIdInfo){
    readFromDB(function(dbInfo){
      returnMyCustomerInArray(function(customerInfo){
        $.ajax({
          url: 'http://rest.genxpression.com/GenXpressionWSRest/AllBalanceOption',
          type: 'POST',
          data: {CustomerID: customerInfo[0], PID: dbInfo.product_id, BranchID: '0', Range1: '', Range2: '', QueryType: '14', UserID: userIdInfo[0], PSWD: userIdInfo[1], ResponseType: "1"},
          dataType: 'json',
          beforeSend: function() {
            $('#extratos .loading-div').show();
            $('#extratos .ajax-loading').addClass('active');
          },
          success: function(data) {
            // Declarando variáveis
            var i = 0; // contador que vai dar o indice ao array
            var ext_local = '-'; // variavel q vai guardar o local
            var ext_pts = []; // array que vai guardar os valores economizados

            $.each(data, function(index, value){
              if (value.RequestStatus == "Success") {

                /*
                 * Como o nome da coluna que guarda o Valor Economizado não é aceito pelo jQuery,
                 * Então foi posto um outro each() para pegar o valor diretamente e coloca-lo dentro do array ext_pts
                 * Como funciona a função:
                 * É verificado se o index2 (nome da coluna) é igual a 'Valor Economizado', se for verdade ele verifica
                 * se não o valor do campo 'Valor Economizado' é diferente de null, se for, então é adicionado o valor
                 * no array ext_pts, e o indice desse valor vai ser igual a variavel i. Caso for igual a null, é colocado um valor '-'
                 * Acho que deu pra entender né? Qualquer dúvida pergunta pro Alan
                */

                $.each(value, function(index2, value2){
                  if (index2 == 'Valor Economizado') {
                    // Verificando se o valor economizado não é vazio
                    if (index2 != null) {
                      ext_pts.splice(i, 0, addCommas(value2));
                    } else {
                      ext_pts.splice(i, 0, '-');
                    }
                  }
                });          

                // Verificando se o local não é vazio
                if (value.Local != null) {
                  ext_local = value.Local;
                }

                // Construindo e inserindo as variáveis na tabela economia
                $('.economy-table tbody').append(
                  "<tr>" + 
                  "<td>" + ext_local + "</td>" + 
                  "<td>" + ext_pts[i] + "</td>" + 
                  "</tr>"
                );

                // Somando mais um no contador que diz o indice do array que guarda os valores economizados
                i++;

              } else {
                if (value.Local == "") {
                  // Construindo e inserindo as variáveis na tabela economia
                  $('.economy-table tbody').append(
                    "<tr>" + 
                    "<td>Sem Registro</td>" + 
                    "</tr>"
                  );
                  $('.economy-table').show('fast');
                } else {
                  alert('Erro ao carregar alguma parte do extrato de economia');
                }
              }

            });
          },
          error: function() {
            alert('Não foi possível carregar o extrato de economia.');
          }

        }).complete(function() {
          $('#extratos .loading-div').hide();
          $('#extratos .ajax-loading').removeClass('active');
          $('.economy-table').show('fast');
        });
      });
    });
  });
}

// Função que monta os extrato passando o query type
function allBalanceOption(queryType, range1Var, range2Var, responseType, callback) {
  var customerIdCookie = getStorage('CustomerID');
  $('.cashback-table').hide('fast');
  $('.premium-ok-table').hide('fast');
  $('.premium-used-table').hide('fast');


  readFromDB(function(userDataReturn){
    getUserID(function(userIdInfo){
      $.ajax({
        url: 'http://rest.genxpression.com/GenXpressionWSRest/AllBalanceOption',
        type: 'POST', // métodos de requisição
        data: {CustomerID: customerIdCookie, PID: userDataReturn.product_id, BranchID: 0, Range1: range1Var, Range2: range2Var, QueryType: queryType, UserID: userIdInfo[0], PSWD: userIdInfo[1], ResponseType: '1'},
        dataType: 'json',
        cache: false,
        beforeSend: function() {
          $('#extratos .loading-div').show();
        },
        success: function(data) {
          // Criando as variaveis de soma se o tipo da função for add
          if (responseType == 'add') {
            var pendVar = 0;
            var okVar = 0;
          }

          $.each(data, function(_, value){
            if (value.RequestStatus == "Success") {
              callback(value);

              // Somando se o tipo da função for add
              if (responseType == 'add') {
                if (value.Status == 'Pendente') {
                  pendVar += parseFloat(value['Cash Back']);
                } else if (value.Status == 'Confirmado') {
                  okVar += parseFloat(value['Cash Back']);
                }
              }
            } else {
              if (responseType == 'table') {
                $('#extratos .cashback-table').append(
                  '<a href="#!" class="collection-item">\
                  <span class="badge"></span><span style="font-size: 14pt;">Nenhum registro localizado</span><br/></a>'
                );
              } else if (responseType == 'premium' && queryType == '32') {
                  $('.premium-ok-table').append(
                  '<a href="#!" class="collection-item">\
                  <span class="badge"></span><span style="font-size: 14pt;">Nenhum registro localizado</span><br/></a>'
                );
              } else if (responseType == 'premium' && queryType == '35') {
                  $('.premium-used-table').append(
                  '<a href="#!" class="collection-item">\
                  <span class="badge"></span><span style="font-size: 14pt;">Nenhum registro localizado</span><br/></a>'
                );
              }
            }
          });

          if (responseType == 'table') {

            $('.cashback-table').show();

          } else if (responseType == 'add') {
            // Escrevendo na home as somas se o tipo da função for add
            $('.cashback-pend').html('R$ ' + addCommas(pendVar.toFixed(2)));
            $('.cashback-ok').html('R$ ' + addCommas(okVar.toFixed(2)));

          } else if (responseType == 'premium') {
            $('.premium-ok-table').show();
            $('.premium-used-table').show();
            $('#ticket .loading-div').hide();
            
          }

        },
        complete: function() {
          $('#extratos .loading-div').hide('fast');
        }
      });
    });
  })

  $('.cashback-table').show('fast');
  
}

/* =============== Funções da Loja */

// Função que monta a loja de premios
function returnMyStore(callback) {
  getUserID(function(returnUserID){
    $.ajax({
      url: 'http://rest.genxpression.com/GenXpressionWSRest/ReadStoreAllActiveFree',
      type: 'POST',
      data: {RootID: ROOT_ID, ResponseType: "1"},
      dataType: 'json',
      cache: false,
      success: function(data) {
        $.each(data, function(_, value){
          callback(value);
        });
      }
    });
  });
}

// Função que retorna os produtos da loja
function returnStoreProducts(deptoId, subDeptID, morePage, callback) {
  $('#premium .loading-div').show();

  returnMyStore(function(returnStore){
    getUserID(function(returnUserID){
      $.ajax({
        url: 'http://rest.genxpression.com/GenXpressionWSRest/ReturnStoreFree',
        type: 'POST',
        data: {RootID: ROOT_ID, StoreID: returnStore.StoreID, DeptoID: deptoId, SubDeptID: subDeptID, ResponseType: "1"},
        dataType: 'json',
        cache: false,
        success: function(data) {
          // Removendo a loja se naõ tiver nenhum item nela
          if (data.length < 0) {
            alert('Nenhum item encontrado');

            return false;
          }

          if (subDeptID != '') {
            var j = 0;
            $.each(data, function(_, value){
              if (typeof value != 'undefined') {
                if (subDeptID == value['SubDeptoID']) {
                  j++;
                }
              }
            });            
          }

          var limit = 9;
          let currentPag = $('#pagination').val();
          let pag = (limit * currentPag) - limit;

          if (morePage == 'false') {
            // Limpando os itens se não for pra carregar só uma pagina nova
            $('#product-collection').html('');
          }
          

          var iLimit = pag + limit;
          if (subDeptID != '') {
            // Se for mais de 9 itens na subcategoria, paginar
            if (j < limit) {
              iLimit = data.length;
            }            
          }
          
          for (var i = pag; i < iLimit; i++) {
            if (typeof data[i] != 'undefined') {
              if (data[i]['Quantity'] > 0) {
                data[i]['Description'] = data[i]['Description'] != null ? data[i]['Description'] : '';
                data[i]['SmallDescription'] = data[i]['SmallDescription'] != null ? data[i]['SmallDescription'] : '';

                if (subDeptID != '') {
                  if (subDeptID == data[i]['SubDeptoID']) {
                    callback(data[i]);
                  }
                } else {
                  callback(data[i]);
                }
              }              
            }            
          }
          
          // Retornando quantos produtos tem
          if (subDeptID != '') {
            var j = 0;
            $.each(data, function(_, value){
              if (typeof value != 'undefined') {
                if (subDeptID == value['SubDeptoID']) {
                  j++;
                }
              }
            });

            if (j < limit) {
              callback(j);
            } else {
              callback(data.length);
            }
            
          } else {
            callback(data.length);
          }          

          $('#premium .loading-div').hide();
        },
        error: function() {
          $('#premium .loading-div').hide();
        }
      });
    });
  });
}

// Função que retorna um produto pelo id
function returnStoreProductById(prodId, callback) {
  returnMyStore(function(returnStore){
    getUserID(function(returnUserID){
      $.ajax({
        url: 'http://rest.genxpression.com/GenXpressionWSRest/ReturnStoreFree',
        type: 'POST',
        data: {RootID:ROOT_ID, StoreID: returnStore.StoreID, DeptoID: 0, SubDeptID: 0, ResponseType: "1"},
        dataType: 'json',
        cache: false,
        success: function(data) {
          var prodTarget = [];
          $.each(data, function(_, value){
            if (value.ItemID == prodId) {
              value.ImageURL = 'http://gnxp.com.br/admin/' + value.ImageURL;
              prodTarget.push(value);
            }
            
          });

          callback(prodTarget);

        }
      });
    });
  });
}

// Função que retorna os departamento da loja
function returnStoreDept(callback) {
  $('#categories .loading-div').show();

  returnMyStore(function(returnStore){
    getUserID(function(returnUserID){
      $.ajax({
        url: 'http://rest.genxpression.com/GenXpressionWSRest/ReadStoreStoreDepartment',
        type: 'POST',
        data: {UserID: returnUserID[0], PSWD: returnUserID[1], StoreID: returnStore.StoreID, Active: '', ResponseType: "1"},
        dataType: 'json',
        cache: false,
        success: function(data) {
          // Limpando as subcategorias mostradas anteriormente
          $('#categories-content .collection').html('\
            <a href="#premium" data-transition="slide" class="ancor-li collection-item" data-cat-id="0">\
              <span href="#premium" class="secondary-content"><i class="fa fa-angle-right"></i></span><span style="font-size: 14pt;">Todas</span>\
            </a>\
          ');

          $.each(data, function(_, value){
            if (value.Status != 0 && value.DeptoName != 'Teste2' && value.DeptoName != 'Department') {
              callback(value);
            }
          });

          $('#categories .loading-div').hide();
        },
        error: function() {
          $('#categories .loading-div').hide();
          alert('Erro ao carregar as categorias');
        }
      });
    });
  });
}

// Função que acha os subdepartamentos por um departamento
function returnStoreSubDept(deptoId, callback) {
  $('#sub-categories .loading-div').show();

  getUserID(function(returnUserID){
    $.ajax({
      url: 'http://rest.genxpression.com/GenXpressionWSRest/StoreSubDepartment',
      type: 'POST',
      data: {UserID: returnUserID[0], UserPSWD: returnUserID[1], DepartmentID: deptoId, Active: '', ResponseType: "1"},
      dataType: 'json',
      cache: false,
      success: function(data) {
        // Limpando as subcategorias mostradas anteriormente
        $('#sub-categories-content .collection').html('\
          <a href="#premium" data-transition="slide" class="ancor-li collection-item" data-subcat-id="0">\
            <span href="#premium" class="secondary-content"><i class="fa fa-angle-right"></i></span><span style="font-size: 14pt;">Todas</span>\
          </a>\
        ');

        $.each(data, function(_, value){
          callback(value);
        });

        $('#sub-categories .loading-div').hide();
      },
      error: function() {
        $('#sub-categories .loading-div').hide();
        alert('Erro ao carregar as subcategorias');
      }
    });
  });
}

// Função q monta as categorias
function createMyCategories() {
  // Montando os departamentos
  if ($('#cat-collection a.collection-item').length) {
    // do nothing
  } else {
    returnStoreDept(function(returnDept){
      $('#cat-collection').append(
        '<a href="#sub-categories" data-transition="slide" class="ancor-li collection-item" data-cat-id="'+returnDept.DeptoID+'">\
          <span href="#sub-categories" class="secondary-content"><i class="fa fa-angle-right"></i></span><span style="font-size: 14pt;">' + returnDept.DeptoName + '</span>\
        </a>'
      );
    });
  }
}

// Função q monta as subcategorias
function createMySubCategories(deptID) {
  // Busca os subdepartamentos pelo departamento, se existir
  returnStoreSubDept(deptID, function(returnSubDept){
    $('#sub-categories-content .collection').append(
      '<a href="#premium" data-transition="slide" class="ancor-li collection-item" data-subcat-id="'+returnSubDept.SubDeptoID+'">\
        <span href="#premium" class="secondary-content"><i class="fa fa-angle-right"></i></span><span style="font-size: 14pt;">' + returnSubDept.SubDeptoName + '</span>\
      </a>'
    );
  });
}

// Função que monta a loja
function createMyStore(morePage) {
  var limit = 9;

  // Pegando o departamento da URL, se existir
  deptoId = $('#deptID').val() != 0 ? $('#deptID').val() : '';
  subDeptoId = $('#subDeptID').val() != 0 ? $('#subDeptID').val() : '';

  // Procurando todos os produtos da loja
  returnStoreProducts(deptoId, subDeptoId, morePage, function(returnStore){
    if ($.isNumeric(returnStore) == true) {
      let numPages = Math.ceil(returnStore / limit);
      let currentPag = $('#pagination').val();
    } else {

      $('#product-collection').append(
        '<a href="#product" data-transition="slidedown" class="ancor-li store-one-col">\
          <li class="collection-item avatar" data-prod-id="'+returnStore.ItemID+'" data-prod-describe="'+returnStore.Description+'" data-prod-small="'+returnStore.SmallDescription+'" data-prod-img="'+returnStore.ImageURL+'" data-prod-title="'+returnStore.Title+'" data-prod-price="'+returnStore.PointsRequired+'" data-prod-branch="'+returnStore.Column1+'">\
            <img src="http://gnxp.com.br/admin/' +returnStore.ImageURL + '" alt="" class="circle">\
            <span class="title">'+truncString(returnStore.Title, 30, '...')+'</span>\
            <p>'+returnStore.PointsRequired+' pontos <br> '+returnStore.Quantity+'</p>\
            <a href="#!" class="secondary-content"><i class="material-icons">more_vert</i></a>\
          </li>\
        </a>'
      );
    }
    
  });
}

// Essa função pega o total de pontos
function myBalance(callback) {
  $.support.cors = true;

  getUserID(function(userIdInfo){
    readFromDB(function(dbInfo){
      $.ajax({
        url: 'http://rest.genxpression.com/GenXpressionWSRest/RetrieveReadyToUseBalance',
        type: 'POST',
        data: {MyCustomer: dbInfo.customer_info, InfoType: dbInfo.info_type, UserID: userIdInfo[0], PSWD: userIdInfo[1], PID: dbInfo.product_id, ResponseType: 1},
        dataType: 'json',
        success: function(data) {
          $.each(data, function (index, value) {
            callback(value.Valor);
          });
        },
        error: function() {
          callback('');
        }
      });
    });
  });
}

// Função que retorna todas as imagens de um item
function returnProductImg(prodId, callback) {
  getUserID(function(returnUserID){
    $.ajax({
      url: 'http://rest.genxpression.com/GenXpressionWSRest/RetrieveImageItemID',
      type: 'POST',
      data: {UserID: returnUserID[0], PSWD: returnUserID[1], ItemID: prodId, ResponseType: "1"},
      dataType: 'json',
      cache: false,
      success: function(data) {
        $("#owl-demo").trigger('destroy.owl.carousel');
        $("#owl-demo .owl-item").remove();

        $.each(data, function(_, value){
          callback(value);
        });

        // $("#owl-demo").trigger('destroy.owl.carousel');
        $("#owl-demo").owlCarousel({
          stopOnHover : true,
          navigation:false,
          paginationSpeed : 1000,
          goToFirstSpeed : 2000,
          singleItem : true,
          autoHeight : true,
          transitionStyle:"fade"
        });
      }
    });
  });
}

// Função que abre o modal do produto
function openMyProductModal(thisVar) {
  var prodId = thisVar.attr('data-prod-id');
  var prodTitle = thisVar.attr('data-prod-title');
  var prodDescr = thisVar.attr('data-prod-describe');
  var prodSmall = thisVar.attr('data-prod-small');
  var prodPrice = thisVar.attr('data-prod-price');
  var prodBranch = thisVar.attr('data-prod-branch');
  var prodImg = thisVar.attr('data-prod-img');

  // Colocando as imagens do produto
  getUserID(function(returnUserID){
    $.ajax({
      url: 'http://rest.genxpression.com/GenXpressionWSRest/RetrieveImageItemID',
      type: 'POST',
      data: {UserID: returnUserID[0], PSWD: returnUserID[1], ItemID: prodId, ResponseType: "1"},
      dataType: 'json',
      cache: false,
      success: function(data) {
        $('.carousel-display').html('<div id="owl-demo" class="owl-carousel"></div>');

        $.each(data, function(_, value){
          $('#owl-demo').append('<div><img src="http://gnxp.com.br/admin/'+value.ImageURL+'" class="slideshow-prod z-depth-1"></div>')
        });

        $("#owl-demo").owlCarousel({
          stopOnHover : true,
          navigation:false,
          paginationSpeed : 1000,
          goToFirstSpeed : 2000,
          singleItem : true,
          autoHeight : true,
          transitionStyle:"fade"
        });
      }
    });
  });

  // Colocando as informações do produtos
  $('#product .brand-logo').html(truncString(prodTitle, 25, '...'));

  var displayVar = $('#product .product-card');
  displayVar.find('.card-title').html(prodTitle);
  displayVar.find('.card-price').html(prodPrice + ' <small>pontos</small>');
  displayVar.find('.card-desc').html(prodDescr);
  displayVar.find('.card-small-desc').html(prodSmall);
  displayVar.find('.btn').attr('onclick', 'buildProdVoucher(\''+prodPrice+'\', \''+prodTitle+'\', \''+prodImg+'\', \''+prodId+'\')');

  if (prodBranch != 0) {
    // Colocando a empresa do produto
    readBranchById(prodBranch, function(returnBranch){
      displayVar.find('.card-branch span').html(returnBranch.CompanyFantasy);
    });
  } else {
    displayVar.find('.card-branch span').html('Qualquer loja');
  }
  
}

function buildProdVoucher(price, name, img, id) {
  var customerId = getStorage("CustomerID");

  // Verficando se o cliente está logado
  if (customerId != '') {
    // Função q pega o saldo de pontos do cliente se ele estiver logado
    myBalance(function(saldoPts){
      if ($.isNumeric(saldoPts)) {
        diffVal = calcTotalPay(saldoPts, parseFloat(price));

        var textVar;
        if (diffVal == 'true') {
            // Abrindo o modal        
            var currentLink = window.location.href;
            currentLink = currentLink.split("#");
            currentLink = currentLink[1];
            $.mobile.navigate( "#"+currentLink+"!" );

            $('#modal-confirm p').html(textVar);
            $('#modal-confirm .modal-footer .yes-btn').attr('onclick', 'onConfirm(\''+id+'\', \''+price+'\', \''+diffVal+'\', \''+img+'\', \''+name+'\');');
            $('#modal-confirm').modal({dismissible: false});
            $('#modal-confirm').modal('open'); 
        } else {
          Materialize.toast('Pontos insuficientes', 3000);
        }

      } else {
        Materialize.toast('Erro ao tentar gerar o cupom. Tente novamente mais tarde.', 5000);
      }
    });
  } else {
    // Se não estiver logado, jogar para pagina de login
    Materialize.toast('Faça login novamente.', 3000);
  }
}

function onConfirm(id, price, diffVal, img, name) {

  regiterMyStoreVoucher(id, price, diffVal, function(returnVoucher){
    if (returnVoucher != -1) {
      if (returnVoucher != '') {
        if (returnVoucher != 0) {
          $('#modal-confirm').modal('close');
          openMyVoucher(name, img, ROOT_ID + returnVoucher, 'prod');
          Materialize.toast('Seu cupom foi gerado com sucesso!', 5000);
        } else {
          window.history.go(-1);
          Materialize.toast('Por favor tente fazer login novamente. Caso o erro persista, tente novamente mais tarde', 5000);
        }  
      } else {
        window.history.go(-1);
        Materialize.toast('Cupom não pôde ser gerado. Tente fazer login novamente.', 4000);
      }                  
    } else {
      window.history.go(-1);
      Materialize.toast('Cupom já gerado anteriormente.', 4000);
    }
  });
}

// Função q abre a pagina de cupom
function openMyVoucher(name, img, code, type) {
  $('#toast-container .toast').fadeOut(function(){
    $(this).remove();
  });

  if (type == 'prod') {
    if (img.indexOf('gnxp') == -1 && img.indexOf('tickets.png') == -1) {
      img = 'http://gnxp.com.br/admin/' + img;
    }
    $('#voucher-container img').attr('src', img);
    $('#voucher-container h4').html(name);
  } else {
    $('#voucher-container .discount').html('<h2 class="primary-color-text">'+name+'</h2><span>de desconto</span>');
  }
  
  
  $('#voucher-container #voucher-code-copy').html(code);

  openNewPage('#voucher', 'slidedown');
}

// Calcula quanto a pessoa tem que pagar de diferença na troca do premio
// totalPts = int, formato americano ; prodPtsTot = string, numero formatado do jeito brasileiro
function calcTotalPay(saldoPts, prodPrice) {
    if (saldoPts >= prodPrice) {
        return 'true';
    } else {
        return 'false';
    }
}

// Função que registra o voucher da loja
function regiterMyStoreVoucher(itemId, points, amount, callback) {
  var HLID = getStorage("HLID");

  points = parseFloat(points);
  amount = parseFloat(addCommasInverse(amount)) ? parseFloat(addCommasInverse(amount)) : '0.00';
  itemId = parseInt(itemId);

  $.ajax({ 
    url: 'http://rest.genxpression.com/GenXpressionWSRest/CreateStoreVoucher',
    type: 'POST',
    data: {RootID: ROOT_ID, ItemID: itemId, PointsRequired: points, AmountRequired: amount, Hash: HLID},
    dataType: 'json',
    cache: false,
    success: function(data) {
      callback(data);
      
    },
    error: function(dataError) {
      callback('');
    }
  });
}


// Função q faz o login de forma nova e muito mais segura (fuck you hackers)
function doMyHashLogin(customerId, customerPSWD, callback) {
  $.ajax({
    url: 'http://rest.genxpression.com/GenXpressionWSRest/CreateCustomerHash',
    type: 'POST',
    data: {RootID: ROOT_ID, CustomerID: customerId, CustomerPSWD: customerPSWD},
    dataType: 'json',
    cache: false,
    success: function(data) {
      if (data != '') {
        callback(data);
      } else {
        callback('');
      }
    },
    error: function(dataError) {
      callback('');
    }
  });
}



/* =========== Fim Funções da Loja */

// Função que retorna o ranking
function getRanking() {
  $.support.cors = true;

  // Removendo o conteúdo da tabela
  $('#ranking .extract-table tbody tr').remove();

  getUserID(function(userIdInfo){
    $.ajax({
      url: 'http://rest.genxpression.com/GenXpressionWSRest/CustomerStatsWithProduct',
      type: 'POST',
      data: {CustomerInfo: 0, InfoType: 0, StatsType: 13, FilialID: 0, ProductID: 0, UserID: userIdInfo[0], PSWD: userIdInfo[1], ResponseType: 1},
      dataType: 'json',
      beforeSend: function() {
        $('#ranking .loading-div').show();
        $('#ranking .ajax-loading').addClass('active');
      },
      success: function(data) {
        for (var i = 0; i < 100; i++) {
          if (data[i].RequestStatus == "Success") {
            var rank_pos = i + 1;
            var rank_name = '-';

            // Verificando se a nome não é vazio
            if (data[i].Nome != null) {
              rank_name = data[i].Nome;
            }

            // Construindo e inserindo as variáveis na tabela de extrato
            $('#ranking .extract-table tbody').append(
              "<tr>" + 
              "<td>" + rank_pos + "</td>" + 
              "<td>" + rank_name + "</td>" + 
              "</tr>"
            );

          } else {
            if (data[i].Nome == "") {
              $('#ranking .extract-table tbody').append(
                "<tr>" + 
                "<td>Sem Registro</td>" + 
                "</tr>"
              );
            } else {
              alert('Não foi possível alguma parte Ranking.');
            }
          }

        }
      },
      error: function() {
        alert('Não foi possível carregar o Ranking.');
      }

    }).complete(function() {
      $('#ranking .loading-div').hide();
      $('#ranking .ajax-loading').removeClass('active');
      $('#ranking .extract-table').show('fast');
    });
  });
}

function readBranchById(branchId, callback) {

  getUserID(function(userIdInfo){
    $.ajax({
      url: 'http://rest.genxpression.com/GenXpressionWSRest/ReadBranchFree',
      type: 'POST',
      data: {BranchID: branchId, RootID: ROOT_ID, ResponseType: '1'},
      dataType: 'json',
      cache: false,
      success: function(data) {
        $.each(data, function(index, value){
          if (value.RequestStatus == "Success") {

            $.ajax({
              url: 'http://rest.genxpression.com/GenXpressionWSRest/RetrieveBranchSimpleRules',
              type: 'POST',
              data: {RootID: ROOT_ID, BranchID: branchId, UserID: userIdInfo[0], PSWD: userIdInfo[1]},
              dataType: 'json',
              success: function(dataPercent){
                value['Percentual'] = dataPercent[0]['Percentual'];
                callback(value);
              }, error: function(dataError) {
                if (dataError.status == 500) {
                  value['Percentual'] = null;
                  callback(value);
                }
              }
            });

          }
        });       
      }
    });
  });
}

// Check da data para saber se ta tudo tranquilo e favoravel
function checkDate(dateVar) {
  if (dateVar != '') {
    dateArr = dateVar.split('/');
    if (dateArr.length == 3) {
      if (dateArr[2].length == 4 && dateArr[1].length == 2 && dateArr[0].length == 2) {
        if (dateArr[0] <= 31) {
          if (dateArr[1] <= 12) {
            if (dateArr[2] >= 1889) {
              var correctDate = dateArr[2] + '-' + dateArr[1] + '-' + dateArr[0];
              return correctDate;
            } else {
              return false;
            }
          } else {
            return false;
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      return false;
    }
  } else {
    return "";
  }
}
// Função que atualiza os dados do contato
function updateCustomer() {
  // Verificando os campos
  var name = $.trim($('#client-name-1').val());
  var email = $.trim($('#client-mail-div input').val());

  cpf = $.trim($('#client-cpf').val());
  cpf = cpf.replace(/\./g, '');
  cpf = cpf.replace(/\-/g, '');

  rg = $.trim($('.client-rg').val());
  rg = rg.replace(/\./g, '');
  rg = rg.replace(/\-/g, '');
  
  var date = $.trim($('.client-date').val());
  if (date == "") {
    date = '1889-12-31';
  } else {
    date = checkDate(date);
  }
  var gender = $('#client-gender-edit').val();
  var nac = $.trim($('.client-country').val());
  var cep = $.trim($('.cep-edit').val());
  var ad1 = $.trim($('.ad1-edit').val());
  var ad2 = $.trim($('.ad2-edit').val());
  var uf = $('#uf-edit').val();
  var nei = $.trim($('.nei-edit').val());
  var city = $('#city-edit').val();
  var tel = $.trim($('.tel-edit').val());
  tel = tel.replace(/\-/g, '');
  tel = tel.replace(/\(/g, '');
  tel = tel.replace(/\)/g, '');
  tel = tel.replace(/\ /g, '');
  var cel = $.trim($('.cel-edit').val());
  cel = cel.replace(/\-/g, '');
  cel = cel.replace(/\(/g, '');
  cel = cel.replace(/\)/g, '');
  cel = cel.replace(/\ /g, '');

  // Pegando o customerID
  var customerId = getStorage("CustomerID");
  
  var externalID = '';
  getUserID(function(userIdInfo){
    $.ajax({
      url: 'http://rest.genxpression.com/GenXpressionWSRest/UpDateMyCustomer',
      type: 'POST',
      data: {Title: '', Name: name, PersonalEmail: email, WorkEmail: '', AddressLine1: ad1, AddressLine2: ad2, Neighborhood: nei, City: city, Homephone: tel, Mobil: cel, Gender: gender, WorkCompany: '', WorkCompanyPhone: '', PhoneExtension: '', Zipcode: cep, Region: uf, Country: '76', ExternalID: externalID, Birthday: date, PersonalID: cpf, PersonalSecondID: rg, Status: '1', CustomerID: customerId, UserID: userIdInfo[0], PSWD: userIdInfo[1], ResponseType: '1'},
      dataType: 'json',
      cache: false,
      success: function(data) {
        if (data == "Sucesso") {
          openAlert("Dados editados com sucesso", 'Sucesso', '', '');
          returnCustomer();
        } else {
          openAlert("Erro ao tentar editar seus dados. Tente mais tarde.", 'Ops', '', '');
        }
      }
    });
  });
}

// Função que pega as top ofertas
function topOffers(callback) {
  $.support.cors = true;

  getUserID(function(userIdInfo){
    $.ajax({
      url: 'http://rest.genxpression.com/GenXpressionWSRest/RetrieveTopOffersFile',
      type: 'POST',
      data: {UserID: userIdInfo[0], PSWD: userIdInfo[1], ResponseType: '1'},
      dataType: 'json',
      cache: false,
      beforeSend: function() {
        $('#top-sale .loading-div').show();
      },
      success: function(data) {
        for (var i = 0; i < 30; i++) {
          if (data[i]['RequestStatus'] == "Success") {

            callback(data[i]);
            
          } else {
            callback("");
          }
        }
      },
      error: function(dataError) {
        callback("");
      },
      complete: function() {
        $('#top-sale .loading-div').hide();
      }
    });
  });
}

// Função que monta as top ofetas
function buildTopOffers() {
  var customerId = getStorage("CustomerID");

  if ($('#top-sale ul li').length <= 0) {
    topOffers(function(offerInfo){
      $('#premium-content ul').append(
        '<a href="#" data-transition="slidedown" class="ancor-li" data-site="'+offerInfo.offerLink+'?mdasc='+customerId+'" data-rel="external" onclick="openBrowser(\'offer\', $(this));">\
          <li class="collection-item avatar">\
            <img src="'+offerInfo.offerThumbnail+'" alt="" class="circle" onerror="javascript:this.src=\'img/img-not-found.jpg\'">\
            <span class="title">'+truncString(offerInfo.offerName, 20, '...')+'</span>\
            <p>R$ '+addCommas(parseFloat(offerInfo.priceTo).toFixed(2))+'<br>\
              Adquira já\
            </p>\
            <a href="#!" class="secondary-content"><i class="fa fa-ellipsis-v"></i></a>\
          </li>\
        </a>'
      )
    });
  }
  
}

// Essa função puxa o nome das cidades do estado
function readCities(ufString, callback) {
  $.support.cors = true;

  var state = ufString;

  getUserID(function(userIdInfo){
    $.ajax({
      url: 'http://rest.genxpression.com/GenXpressionWSRest/Cities',
      type: 'POST',
      data: {Region: state, UserID: userIdInfo[0], PSWD: userIdInfo[1]},
      dataType: 'json',
      cache: false,
      success: function(data){
        
        $.each(data, function(index, value){
          if (value.RequestStatus == "Success") {
            callback(value);
          }
        });

        $('#city-edit').material_select();
      },
      complete: function() {
        // $('.client-city-div option').remove();
      }
    });
  });

}

// Essa função monta as cidades
function createCities(ufString, cityTarget) {
  $('select.client-city option').remove();

  readCities(ufString, function(cityInfo){
    if (cityTarget != '' && cityTarget == cityInfo.CityID) {
      $('input.client-city').val(cityInfo.Name);
      // Colocando a cidade no painel da conta
      $('#client-city-panel').append(' / ' + cityInfo.Name);

    } else if (cityTarget != '' && cityTarget != cityInfo.CityID) {
      // Faz nada
    } else {
      $('select.client-city').append(
        '<option value="'+cityInfo.CityID+'">'+cityInfo.Name+'</option>'
      );
    }
  });
}

// Essa função monta as lojas online
function buildOnlineShop() {
  var carouselLomadee = [
    {
      title: "",
      type: 3,
      extra: false,
      itens: [
        
        {
          img: "https://www.lomadee.com/programas/BR/5632/imagemBox_80x60.png", 
          name: "4%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Lojas Americanas',
          dis: 5632,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/24215181",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5860/imagemBox_80x60.png", 
          name: "1,75%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Ricardo Eletro',
          dis: 5860,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/95dae189",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5766/imagemBox_80x60.png", 
          name: "4%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Submarino',
          dis: 5766,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/971ce9fb",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5727/imagemBox_80x60.png", 
          name: "1,75%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Girafa',
          dis: 5727,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/94d10001",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5755/imagemBox_80x60.png", 
          name: "2%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Extra',
          dis: 5755,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/be81b246",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5901/imagemBox_80x60.png", 
          name: "5,5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Nike',
          dis: 5901,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/0cbf23c5",
        },

        {
          img: "https://www.lomadee.com/programas/BR/27/imagemBox_80x60.png", 
          name: "4%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Saraiva',
          dis: 27,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/fe03a2d8",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5630/imagemBox_80x60.png", 
          name: "3,5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Carrefour',
          dis: 5630,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/70506e25",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5798/imagemBox_80x60.png", 
          name: "2,5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Lenovo',
          dis: 5798,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/107a436b",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5754/imagemBox_80x60.png", 
          name: "2%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Ponto Frio',
          dis: 5754,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/a620ff19",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5787/imagemBox_80x60.png", 
          name: "1,75%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Fast',
          dis: 5787,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/eed5d017",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5731/imagemBox_80x60.png", 
          name: "1,75%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'FNAC',
          dis: 5731,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/9f23ed4b",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5756/imagemBox_80x60.png", 
          name: "2%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Casas Bahia',
          dis: 5756,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/3c2c7c19",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5545/imagemBox_80x60.png", 
          name: "5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Sepha',
          dis: 5545,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/3c7695be",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5576/imagemBox_80x60.png", 
          name: "2,5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Walmart',
          dis: 5576,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/c346b590",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5644/imagemBox_80x60.png", 
          name: "4%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Shoptime',
          dis: 5644,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/2851baeb",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5736/imagemBox_80x60.png", 
          name: "2,5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Camiseteria',
          dis: 5736,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/55f280e3",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5777/imagemBox_80x60.png", 
          name: "5,5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Sephora',
          dis: 5777,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/4c9a47d2",
        },

        {
          img: "https://www.lomadee.com/programas/BR/11/imagemBox_80x60.png", 
          name: "3,5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Livraria da Travessa',
          dis: 11,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/3ada3320",
        },

        {
          img: "https://www.lomadee.com/programas/BR/158/imagemBox_80x60.png", 
          name: "3,5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Polishop',
          dis: 158,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/e1eb0084",
        },

        {
          img: "https://www.lomadee.com/programas/BR/2853/imagemBox_80x60.png", 
          name: "3%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Loccitane',
          dis: 2853,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/fffc88a7",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5714/imagemBox_80x60.png", 
          name: "4%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Centauro',
          dis: 5714,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/27a0f1b8",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5717/imagemBox_80x60.png", 
          name: "5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Dressit',
          dis: 5717,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/3c0d7489",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5751/imagemBox_80x60.png", 
          name: "3%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Mobly',
          dis: 5751,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/78074241",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5761/imagemBox_80x60.png", 
          name: "4%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Época',
          dis: 5761,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/30cda9e6",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5772/imagemBox_80x60.png", 
          name: "3%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Livraria da Folha',
          dis: 5772,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/9f17fab2",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5783/imagemBox_80x60.png", 
          name: "4,5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Netshoes',
          dis: 5783,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/63b23403",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5800/imagemBox_80x60.png", 
          name: "2%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Mega Mamute',
          dis: 5800,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/f05ca592",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5840/imagemBox_80x60.png", 
          name: "2,5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Rihappy',
          dis: 5840,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/95e15661",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5856/imagemBox_80x60.png", 
          name: "1,75%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Balão da Informática',
          dis: 5856,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/8677ae1a",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5861/imagemBox_80x60.png", 
          name: "3,25%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Anna Pegova',
          dis: 5861,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/08f21d77",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5866/imagemBox_80x60.png", 
          name: "1,6%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Clube do Ricardo',
          dis: 5866,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/13cc932f",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5876/imagemBox_80x60.png", 
          name: "4%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Livraria Cultura',
          dis: 5876,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/cee4a4b3",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5896/imagemBox_80x60.png", 
          name: "2,25%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'MXT Shop',
          dis: 5896,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/23354d16",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5902/imagemBox_80x60.png", 
          name: "4,75%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Nina Bruni',
          dis: 5902,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/1acddaad",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5925/imagemBox_80x60.png", 
          name: "2,65%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Liquidae',
          dis: 5925,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/fe2552f4",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5934/imagemBox_80x60.png", 
          name: "1,75%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Bee Fitness',
          dis: 5934,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/757cf476",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5947/imagemBox_80x60.png", 
          name: "3%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Strawberry net',
          dis: 5947,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/e8aa03be",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5948/imagemBox_80x60.png", 
          name: "2,5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Enjoei',
          dis: 5948,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/615eb0cd",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5951/imagemBox_80x60.png", 
          name: "2,65%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Classic Tennis',
          dis: 5951,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/6ddbc1e3",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5952/imagemBox_80x60.png", 
          name: "5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Sieno',
          dis: 5952,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/72102073",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5955/imagemBox_80x60.png", 
          name: "1,75%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Ovelha Negra',
          dis: 5955,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/389700f5",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5960/imagemBox_80x60.png", 
          name: "4%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Abra Cadabra',
          dis: 5960,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/94e79f59",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5961/imagemBox_80x60.png", 
          name: "4%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Abra Casa',
          dis: 5961,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/8f3a8d9b",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5966/imagemBox_80x60.png", 
          name: "5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Fut Fanatics',
          dis: 5966,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/ed761ee6",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5968/imagemBox_80x60.png", 
          name: "4%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Mash',
          dis: 5968,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/93ef989c",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5979/imagemBox_80x60.png", 
          name: "2,65%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Clube do Malte',
          dis: 5979,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/177ee22e",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5986/imagemBox_80x60.png", 
          name: "3%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'ClickBus',
          dis: 5986,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/7fd050d6",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5987/imagemBox_80x60.png", 
          name: "2,5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Comprei é Meu',
          dis: 5987,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/fe47b7ce",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5990/imagemBox_80x60.png", 
          name: "1,75%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Churrasqueiras Weber',
          dis: 5990,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/3b5ccea7",
        },

        {
          img: "https://www.lomadee.com/programas/BR/5998/imagemBox_80x60.png", 
          name: "3%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'L\'occitane au Brésil',
          dis: 5998,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/95a30b04",
        },

        {
          img: "https://www.lomadee.com/programas/BR/6003/imagemBox_80x60.png", 
          name: "2%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Viaja.net',
          dis: 6003,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/14cd0565",
        },

        {
          img: "https://www.lomadee.com/programas/BR/6004/imagemBox_80x60.png", 
          name: "3%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Calçados Online',
          dis: 6004,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/8fda9447",
        },

        {
          img: "https://www.lomadee.com/programas/BR/6005/imagemBox_80x60.png", 
          name: "2%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Super Muffato',
          dis: 6005,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/ec6a608c",
        },


        {
          img: "https://www.lomadee.com/programas/BR/6007/imagemBox_80x60.png", 
          name: "5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Amaro',
          dis: 6007,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/37c138e7",
        },

        {
          img: "https://www.lomadee.com/programas/BR/6009/imagemBox_80x60.png", 
          name: "3,25%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Onofre',
          dis: 6009,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/8915054f",
        },

        {
          img: "https://www.lomadee.com/programas/BR/6011/imagemBox_80x60.png", 
          name: "4%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Sensual SexShop',
          dis: 6011,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/e9114d27",
        },

        {
          img: "https://www.lomadee.com/programas/BR/6012/imagemBox_80x60.png", 
          name: "3,75%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Olho Fashion',
          dis: 6012,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/c19c35bc",
        },

        {
          img: "https://www.lomadee.com/programas/BR/6015/imagemBox_80x60.png", 
          name: "2,5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Pandora Store',
          dis: 6015,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/01a8a1d5",
        },

        {
          img: "https://www.lomadee.com/programas/BR/6017/imagemBox_80x60.png", 
          name: "2,5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Havan',
          dis: 6017,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/ccc140b0",
        },

        {
          img: "https://www.lomadee.com/programas/BR/6020/imagemBox_80x60.png", 
          name: "2,5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Mania Pop',
          dis: 6020,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/34741a1c",
        },

        {
          img: "https://www.lomadee.com/programas/BR/6022/imagemBox_80x60.png", 
          name: "2,75%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Drogaria São Paulo',
          dis: 6022,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/f7bc65bf",
        },

        {
          img: "https://www.lomadee.com/programas/BR/6023/imagemBox_80x60.png", 
          name: "2,75%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Drogaria Pacheco',
          dis: 6023,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/343be1b1",
        },

        {
          img: "https://www.lomadee.com/programas/BR/6024/imagemBox_80x60.png", 
          name: "1,5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Multi-Ar',
          dis: 6024,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/f9f85bab",
        },

        {
          img: "https://www.lomadee.com/programas/BR/6026/imagemBox_80x60.png", 
          name: "4%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Contabilista - Papelaria e Informática',
          dis: 6026,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/643b2983",
        },

        {
          img: "https://www.lomadee.com/programas/BR/6028/imagemBox_80x60.png", 
          name: "3,5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Okulos',
          dis: 6028,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/a37cd3a4",
        },

        {
          img: "https://www.lomadee.com/programas/BR/6033/imagemBox_80x60.png", 
          name: "2,75%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Loja Multilaser',
          dis: 6033,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/8ea8ef04",
        },

        {
          img: "https://www.lomadee.com/programas/BR/6037/imagemBox_80x60.png", 
          name: "1,25%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'PneuStore',
          dis: 6037,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/a03b78aa",
        },

        {
          img: "https://www.lomadee.com/programas/BR/6039/imagemBox_80x60.png", 
          name: "3,5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Chico Rei',
          dis: 6039,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/5addfe8b",
        },

        {
          img: "https://www.lomadee.com/programas/BR/6041/imagemBox_80x60.png", 
          name: "2,5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'PBKids',
          dis: 6041,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/e0c882e5",
        },

        {
          img: "https://www.lomadee.com/programas/BR/6046/imagemBox_80x60.png", 
          name: "3,25%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'Fast Runner',
          dis: 6046,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/bb44990c",
        },

        {
          img: "https://www.lomadee.com/programas/BR/6057/imagemBox_80x60.png", 
          name: "5%", 
          priceOld: null, 
          priceNew: "PARA VOCÊ",
          logo: 'TVZ',
          dis: 6057,
          btn: "SAIBA MAIS",
          link: "http://compre.vc/v2/b5e5fa98",
        },


        
      ],
    },
  ];

  if ($('#get-online-content .online-col-1 .card').length) {
    // Faz nada pq ja tem as lojas carregadas
  } else {
    var customerIdCookie = getStorage('CustomerID');

    // Contando quantas lojas online tem
    var countShop = carouselLomadee[0]['itens'].length;
    var shopPerCol = Math.round(countShop / 2);
    absRows = shopPerCol;

    var i = 0;
    var myDiv = 1;

    $.each(carouselLomadee[0]['itens'], function(_, value){
      var cloneCard = $('#get-online-content .for-example > .card').clone();
      var targetLink = value.link + '?mdasc=' + customerIdCookie

      cloneCard.find('.here-is-discount a').html(value.name);
      cloneCard.find('.card-title').html(value.logo);
      cloneCard.attr('data-site', targetLink);
      cloneCard.attr('onclick', 'openModalLomadee("'+targetLink+'", "'+value.img+'", "'+value.dis+'")');
      cloneCard.find('.seller-img').attr('src', value.img);

      if (i >= shopPerCol) {
        myDiv++;
        shopPerCol += absRows;
      }

      $('#get-online-content .online-col-'+myDiv).append(cloneCard);

      i++;
    });
  }

  
}

// Função que pega o ProductID
function getProdId(callback) {
  $.support.cors = true;

  /*
    * Parâmetros
      - CustomerInfo: email, matrícula, cpf digitado pelo cliente
      - InfoType: 1-email, 2-matricula, 3-cpf
      - UserID: Descoberto na função getUserID()
      - PSWD: Descoberto na função getUserID()
      - ResponseType: 1-json, 2-xml
  */

  var customerInfo = "";

  readFromDB(function(dbInfo){
    if (dbInfo != "") {
      readFromDB(function(dbInfo){
        customerInfo = dbInfo.customer_info;
        infoTypeVal = dbInfo.info_type;
      });
    } else {
      customerInfo = $('#login-username').val();
      infoTypeVal = $('input[name=info-type]:checked').val();
    }
  });

  getUserID(function(userIdInfo){
    $.ajax({
      url: 'http://rest.genxpression.com/GenXpressionWSRest/RetrieveMyProducts',
      type: 'POST',
      data: {CustomerInfo: customerInfo, InfoType: infoTypeVal, UserID: userIdInfo[0], PSWD: userIdInfo[1], ResponseType: '1'},
      dataType: 'json',
      success: function(data) {
        $.each(data, function (index, value) {
          if (value['RequestStatus'] == "Success") {
            // retorno do ajax para a função
            callback(value.ProductID);
          } else {
            callback("");
          }
        });

      }
    });
  });
}

// Função que abre o modal das lojas online
function openModalLomadee(link, img, id) {
  var lomadeeLoad = $('.load-div-modal');

  // Colocando o link
  $('#modal-lomadee .redirect-link').attr('data-site', link);
  $('#modal-lomadee .redirect-link').attr('onclick', 'openBrowser("offer", $(this))');
  // Colocando a imagem
  $('#modal-lomadee .lomadee-seller-img-modal').attr('src', img);
  // Limpando a tabela
  $('#modal-lomadee .lomadee-percent-table .collection').html('');
  $('.alerts-content .alert-warning').hide();
  $('.alerts-content .alert-success').hide();
  $('.lomadee-percent-table').hide();
  // Abrindo o modal
  $('#modal-lomadee').modal('open');
  $.mobile.navigate( "#get-online!" );

  // Vendo a tabela da loja pelo id
  var tableLomadee = findPercentualOfLomadee(id);

  // Tem restrição a loja
  if (tableLomadee.length > 0) {
    $.each(tableLomadee, function(_, value){
      $('#modal-lomadee .lomadee-percent-table .collection').append(
        '<a href="#!" class="collection-item"><span class="badge">'+value.percent+'%</span>'+value.cat+'</a>'
      );
    });
  }

  // Colocando o texto
  $('#modal-lomadee .modal-title').html('Aguarde!');
  $('#modal-lomadee .modal-subtitle').html('Estamos preparando tudo para você!');
  $('.load-div-modal').show();
  $('.redirect-link').attr('disabled', 'disabled');

  t = 0;
  // Fazendo uma contagem regressiva até 4 segundos
  timeInterval = setInterval(function(){
    t++;
    if (t == 3) {
      $('#modal-lomadee .modal-title').html('Tudo Pronto!');
      $('#modal-lomadee .modal-subtitle').html('Clique no botão abaixo para acessar a loja!');
      $('.load-div-modal').hide();// Escondendo o loader
      $('.redirect-link').removeAttr('disabled'); // Habilitando o botao
      // Vendo qual alert mostrar
      if (tableLomadee.length > 0) {
        // Tem restrição a loja
        $('.alerts-content .alert-warning').show();
        $('.lomadee-percent-table').show();// Mostrando o conteudo
      } else {
        // Não tem restrição a loja
        $('.alerts-content .alert-success').show();
      }

      // Saindo o intervalo
      clearInterval(timeInterval);
    }
  }, 1000);
}

// Função que ve se a loja online tem restrições
function findPercentualOfLomadee(lomadeeID) {
  var lomadeeTable = [];
  if (lomadeeID == 5632) { // Americanas
    lomadeeTable = [
      {
        cat: 'ALIMENTOS & BEBIDAS',
        percent: '1,0'
      },
      {
        cat: 'ARTES',
        percent: '1,0'
      },
      {
        cat: 'ARTIGOS DE NATAL',
        percent: '1,0'
      },
      {
        cat: 'AUDIO',
        percent: '1,0'
      },
      {
        cat: 'AUTOMOTIVO',
        percent: '1,0'
      },
      {
        cat: 'B2B2C',
        percent: '1,0'
      },
      {
        cat: 'BEBES',
        percent: '2,0'
      },
      {
        cat: 'BELEZA & SAUDE',
        percent: '2,0'
      },
      {
        cat: 'BRINQUEDOS',
        percent: '2,0'
      },
      {
        cat: 'CAMA MESA & BANHO',
        percent: '2,0'
      },
      {
        cat: 'CASA & CONFORTO',
        percent: '1,0'
      },
      {
        cat: 'CASA & JARDIM',
        percent: '2,0'
      },
      {
        cat: 'CDS & DVDS MUSICAIS',
        percent: '2,0'
      },
      {
        cat: 'CINE & FOTO',
        percent: '1,0'
      },
      {
        cat: 'CLIMATIZAÇÃO',
        percent: '1,0'
      },
      {
        cat: 'CONSOLES & GAMES',
        percent: '2,3'
      },
      {
        cat: 'COOL STUFF',
        percent: '1,5'
      },
      {
        cat: 'DVDS & BLU-RAY',
        percent: '2,0'
      },
      {
        cat: 'ELETRODOMESTICOS',
        percent: '1,5'
      },
      {
        cat: 'ELETRODOMESTICOS 2',
        percent: '1,5'
      },
      {
        cat: 'ELETRONICOS',
        percent: '1,5'
      },
      {
        cat: 'ELETROPORTATEIS',
        percent: '1,0'
      },
      {
        cat: 'EMBALAGENS',
        percent: '1,0'
      },
      {
        cat: 'ESPORTE & LAZER',
        percent: '1,0'
      },
      {
        cat: 'FASHION - TODAS',
        percent: '4,0'
      },
      {
        cat: 'FRALDAS & HIGIENE',
        percent: '2,0'
      },
      {
        cat: 'FUN KITCHEN',
        percent: '1,0'
      },
      {
        cat: 'FUTEBOL',
        percent: '1,0'
      },
      {
        cat: 'GENERICOS',
        percent: '1,0'
      },
      {
        cat: 'INFORMATICA ACESSORIOS',
        percent: '1,0'
      },
      {
        cat: 'INSTRUMENTOS MUSICAIS',
        percent: '2,0'
      },
      {
        cat: 'LA CUISINE',
        percent: '1,0'
      },
      {
        cat: 'LIFE ZONE',
        percent: '1,5'
      },
      {
        cat: 'LIVROS - TODAS',
        percent: '3,0'
      },
      {
        cat: 'MALAS & ACESSORIOS',
        percent: '1,5'
      },
      {
        cat: 'MODA & ACESSORIOS',
        percent: '4,0'
      },
      {
        cat: 'MÓVEIS - TODAS',
        percent: '1,5'
      },
      {
        cat: 'PAPELARIA',
        percent: '2,0'
      },
      {
        cat: 'PÁSCOA',
        percent: '1,0'
      },
      {
        cat: 'PCS',
        percent: '1,5'
      },
      {
        cat: 'PERFUMARIA',
        percent: '1,5'
      },
      {
        cat: 'PET SHOP',
        percent: '1,5'
      },
      {
        cat: 'RELOGIOS & PRESENTE',
        percent: '2,0'
      },
      {
        cat: 'SEGUROS E SERVIÇOS',
        percent: '1,0'
      },
      {
        cat: 'SERVIÇOS',
        percent: '1,0'
      },
      {
        cat: 'SINALIZAÇÃO E SEGURANÇA',
        percent: '1,5'
      },
      {
        cat: 'SUPLEMENTOS & VITAMINAS',
        percent: '1,5'
      },
      {
        cat: 'TABLETS, IMPRESSÃO & IMAGEM',
        percent: '1,5'
      },
      {
        cat: 'TELEFONIA',
        percent: '1,5'
      },
      {
        cat: 'TELEFONIA FIXA',
        percent: '1,0'
      },
      {
        cat: 'TENIS',
        percent: '4,0'
      },
      {
        cat: 'UTILIDADES DOMESTICAS',
        percent: '1,0'
      },
    ]
  } else if (lomadeeID == 5766) { // Submarino
    lomadeeTable = [
      {
        cat: 'ALIMENTOS & BEBIDAS',
        percent: '1,0'
      },
      {
        cat: 'ARTES',
        percent: '1,0'
      },
      {
        cat: 'ARTIGOS DE NATAL',
        percent: '1,0'
      },
      {
        cat: 'AUDIO',
        percent: '1,0'
      },
      {
        cat: 'AUTOMOTIVO',
        percent: '1,0'
      },
      {
        cat: 'B2B2C',
        percent: '1,0'
      },
      {
        cat: 'BEBES',
        percent: '2,0'
      },
      {
        cat: 'BELEZA & SAUDE',
        percent: '2,0'
      },
      {
        cat: 'BRINQUEDOS',
        percent: '2,0'
      },
      {
        cat: 'CAMA MESA & BANHO',
        percent: '1,0'
      },
      {
        cat: 'CASA & CONFORTO',
        percent: '1,0'
      },
      {
        cat: 'CASA & JARDIM',
        percent: '2,0'
      },
      {
        cat: 'CDS & DVDS MUSICAIS',
        percent: '2,0'
      },
      {
        cat: 'CINE & FOTO',
        percent: '1,0'
      },
      {
        cat: 'CLIMATIZAÇÃO',
        percent: '1,0'
      },
      {
        cat: 'CONSOLES & GAMES',
        percent: '2,0'
      },
      {
        cat: 'COOL STUFF',
        percent: '1,5'
      },
      {
        cat: 'DVDS & BLU-RAY',
        percent: '2,0'
      },
      {
        cat: 'ELETRODOMESTICOS',
        percent: '1,5'
      },
      {
        cat: 'ELETRODOMESTICOS 2',
        percent: '1,5'
      },
      {
        cat: 'ELETRONICOS',
        percent: '1,5'
      },
      {
        cat: 'ELETROPORTATEIS',
        percent: '1,0'
      },
      {
        cat: 'EMBALAGENS',
        percent: '1,0'
      },
      {
        cat: 'ESPORTE & LAZER',
        percent: '1,0'
      },
      {
        cat: 'FASHION - TODAS',
        percent: '4,0'
      },
      {
        cat: 'FRALDAS & HIGIENE',
        percent: '2,0'
      },
      {
        cat: 'FUN KITCHEN',
        percent: '1,0'
      },
      {
        cat: 'FUTEBOL',
        percent: '1,0'
      },
      {
        cat: 'GENERICOS',
        percent: '1,0'
      },
      {
        cat: 'INFORMATICA ACESSORIOS',
        percent: '1,0'
      },
      {
        cat: 'INSTRUMENTOS MUSICAIS',
        percent: '2,0'
      },
      {
        cat: 'LA CUISINE',
        percent: '1,0'
      },
      {
        cat: 'LIFE ZONE',
        percent: '1,5'
      },
      {
        cat: 'LIVROS - IMPORTADOS',
        percent: '2,0'
      },
      {
        cat: 'LIVROS INTERESSE GERAL',
        percent: '3,5'
      },
      {
        cat: 'LIVROS TÉCNICOS',
        percent: '3,5'
      },
      {
        cat: 'MALAS & ACESSORIOS',
        percent: '2,0'
      },
      {
        cat: 'MODA & ACESSORIOS',
        percent: '4,0'
      },
      {
        cat: 'MÓVEIS - TODAS',
        percent: '1,0'
      },
      {
        cat: 'PAPELARIA',
        percent: '1,0'
      },
      {
        cat: 'PÁSCOA',
        percent: '1,0'
      },
      {
        cat: 'PCS',
        percent: '1,5'
      },
      {
        cat: 'PERFUMARIA',
        percent: '1,0'
      },
      {
        cat: 'PET SHOP',
        percent: '1,0'
      },
      {
        cat: 'RELOGIOS & PRESENTE',
        percent: '1,0'
      },
      {
        cat: 'SEGUROS E SERVIÇOS',
        percent: '1,0'
      },
      {
        cat: 'SINALIZAÇÃO E SEGURANÇA',
        percent: '1,5'
      },
      {
        cat: 'SUPLEMENTOS & VITAMINAS',
        percent: '1,5'
      },
      {
        cat: 'TABLETS, IMPRESSÃO & IMAGEM',
        percent: '1,5'
      },
      {
        cat: 'TELEFONIA',
        percent: '1,5'
      },
      {
        cat: 'TELEFONIA FIXA',
        percent: '1,0'
      },
      {
        cat: 'TENIS',
        percent: '4,0'
      },
      {
        cat: 'UTILIDADES DOMESTICAS',
        percent: '1,0'
      },
    ]
  } else if (lomadeeID == 27) { // Saraiva
    lomadeeTable = [
      {
        cat: 'Áudio',
        percent: '1,5'
      },
      {
        cat: 'Aventura e Lazer',
        percent: '1,5'
      },
      {
        cat: 'Beleza e Saúde',
        percent: '1,5'
      },
      {
        cat: 'Brinquedos',
        percent: '1,5'
      },
      {
        cat: 'Câmera e Acessórios',
        percent: '1,5'
      },
      {
        cat: 'Câmera e Acessórios',
        percent: '1,5'
      },
      {
        cat: 'Cds Importados',
        percent: '2,0'
      },
      {
        cat: 'Cine e Foto',
        percent: '2,0'
      },
      {
        cat: 'Dvds Shows',
        percent: '2,0'
      },
      {
        cat: 'Eletrônicos',
        percent: '1,5'
      },
      {
        cat: 'Filmes',
        percent: '2,0'
      },
      {
        cat: 'Games',
        percent: '2,0'
      },
      {
        cat: 'Informática',
        percent: '1,5'
      },
      {
        cat: 'Lev',
        percent: '1,5'
      },
      {
        cat: 'Livros',
        percent: '4,0'
      },
      {
        cat: 'Livros Importados',
        percent: '4,0'
      },
      {
        cat: 'Música',
        percent: '2,0'
      },
      {
        cat: 'Papelaria',
        percent: '2,0'
      },
      {
        cat: 'Produtos Digitais',
        percent: '1,5'
      },
      {
        cat: 'Software',
        percent: '2,0'
      },
      {
        cat: 'Telefonia & Celular',
        percent: '1,5'
      },

    ] 
  } else if (lomadeeID == 5630) { // carrefur (nao seu escrever)
    lomadeeTable = [
      {
        cat: 'Acessórios e Periféricos',
        percent: '2,3'
      },
      {
        cat: 'Armazenamento e Organização',
        percent: '2,5'
      },
      {
        cat: 'Audio',
        percent: '2,0'
      },
      {
        cat: 'Beber e Servir',
        percent: '1,7'
      },
      {
        cat: 'Bebês',
        percent: '3,0'
      },
      {
        cat: 'Beleza e Saúde',
        percent: '3,5'
      },
      {
        cat: 'Bicicletas',
        percent: '2,0'
      },
      {
        cat: 'Blu-Ray e DVD Player',
        percent: '1,3'
      },
      {
        cat: 'Brinquedos',
        percent: '2,5'
      },
      {
        cat: 'Cama, mesa e banho',
        percent: '2,5'
      },
      {
        cat: 'Câmeras e Filmadoras',
        percent: '2,0'
      },
      {
        cat: 'Cartuchos e Toner',
        percent: '2,3'
      },
      {
        cat: 'Casa e Jardim',
        percent: '2,0'
      },
      {
        cat: 'Climatização Leve',
        percent: '2,0'
      },
      {
        cat: 'Climatização Pesada',
        percent: '1,7'
      },
      {
        cat: 'Colchões',
        percent: '2,0'
      },
      {
        cat: 'Computador',
        percent: '2,0'
      },
      {
        cat: 'Consoles',
        percent: '2,3'
      },
      {
        cat: 'Costura',
        percent: '2,0'
      },
      {
        cat: 'Decoração',
        percent: '1,7'
      },
      {
        cat: 'Eletrodomésticos',
        percent: '1,7'
      },
      {
        cat: 'Ferramentas e Segurança',
        percent: '2,0'
      },
      {
        cat: 'Fitness',
        percent: '2,0'
      },
      {
        cat: 'Fraldas',
        percent: '3,0'
      },
      {
        cat: 'Games',
        percent: '2,3'
      },
      {
        cat: 'Home Theater',
        percent: '2,0'
      },
      {
        cat: 'Impressoras e Multifuncionais',
        percent: '2,0'
      },
      {
        cat: 'Lazer e Jogos',
        percent: '2,0'
      },
      {
        cat: 'Limpeza e Lavanderia',
        percent: '2,0'
      },
      {
        cat: 'Malas e Mochilas',
        percent: '2,0'
      },
      {
        cat: 'Móveis',
        percent: '2,0'
      },
      {
        cat: 'Notebook',
        percent: '1,8'
      },
      {
        cat: 'Pneus e Rodas',
        percent: '1,7'
      },
      {
        cat: 'Preparar e Cozinhar',
        percent: '2,0'
      },
      {
        cat: 'Projetores',
        percent: '2,3'
      },
      {
        cat: 'Relógios',
        percent: '2,3'
      },
      {
        cat: 'Smartphones e Celulares',
        percent: '1,8'
      },
      {
        cat: 'Som Automotivo e GPS',
        percent: '2,0'
      },
      {
        cat: 'Tablet',
        percent: '2,0'
      },
      {
        cat: 'Telefonia Fixa',
        percent: '1,8'
      },
      {
        cat: 'TV',
        percent: '1,8'
      },
      {
        cat: 'Utensílios para Cozinha',
        percent: '2,0'
      },

    ]
  } else if (lomadeeID == 5644) { // shoptime
    lomadeeTable = [
      {
        cat: 'ALIMENTOS & BEBIDAS',
        percent: '2,3'
      },
      {
        cat: 'ARTES',
        percent: '1,0'
      },
      {
        cat: 'ARTIGOS DE NATAL',
        percent: '1,0'
      },
      {
        cat: 'AUDIO',
        percent: '1,0'
      },
      {
        cat: 'AUTOMOTIVO',
        percent: '1,0'
      },
      {
        cat: 'B2B2C',
        percent: '1,0'
      },
      {
        cat: 'BEBES',
        percent: '2,0'
      },
      {
        cat: 'BELEZA & SAUDE',
        percent: '2,0'
      },
      {
        cat: 'BRINQUEDOS',
        percent: '2,0'
      },
      {
        cat: 'CAMA MESA & BANHO',
        percent: '2,3'
      },
      {
        cat: 'CASA & CONFORTO',
        percent: '2,3'
      },
      {
        cat: 'CASA & JARDIM',
        percent: '2,0'
      },
      {
        cat: 'CDS & DVDS MUSICAIS',
        percent: '1,0'
      },
      {
        cat: 'CINE & FOTO',
        percent: '1,0'
      },
      {
        cat: 'CLIMATIZAÇÃO',
        percent: '1,0'
      },
      {
        cat: 'CONSOLES & GAMES',
        percent: '2,0'
      },
      {
        cat: 'COOL STUFF',
        percent: '1,5'
      },
      {
        cat: 'DVDS & BLU-RAY',
        percent: '1,0'
      },
      {
        cat: 'ELETRODOMESTICOS',
        percent: '1,5'
      },
      {
        cat: 'ELETRODOMESTICOS 2',
        percent: '1,5'
      },
      {
        cat: 'ELETRONICOS',
        percent: '1,5'
      },
      {
        cat: 'ELETROPORTATEIS',
        percent: '2,3'
      },
      {
        cat: 'EMBALAGENS',
        percent: '1,0'
      },
      {
        cat: 'ESPORTE & LAZER',
        percent: '2,3'
      },
      {
        cat: 'FASHION - BOLSAS E ACESSORIOS',
        percent: '1,0'
      },
      {
        cat: 'FASHION - CALÇADOS',
        percent: '4,0'
      },
      {
        cat: 'FASHION - ESPORTE',
        percent: '1,0'
      },
      {
        cat: 'FASHION - OFICIAIS PARA FÃS',
        percent: '1,0'
      },
      {
        cat: 'FASHION - OUTLET',
        percent: '1,0'
      },
      {
        cat: 'FASHION - ROUPA FEMININA',
        percent: '4,0'
      },
      {
        cat: 'FASHION - ROUPA INFANTO JUVENIL',
        percent: '1,0'
      },
      {
        cat: 'FASHION - ROUPA MASCULINA',
        percent: '4,0'
      },
      {
        cat: 'FASHION - UNDERWEAR E MODA PRAIA',
        percent: '1,0'
      },
      {
        cat: 'FRALDAS & HIGIENE',
        percent: '2,0'
      },
      {
        cat: 'FUN KITCHEN',
        percent: '2,3'
      },
      {
        cat: 'FUTEBOL',
        percent: '1,0'
      },
      {
        cat: 'GENERICOS',
        percent: '1,0'
      },
      {
        cat: 'INFORMATICA ACESSORIOS',
        percent: '1,0'
      },
      {
        cat: 'INSTRUMENTOS MUSICAIS',
        percent: '2,0'
      },
      {
        cat: 'LA CUISINE',
        percent: '2,3'
      },
      {
        cat: 'LIFE ZONE',
        percent: '2,3'
      },
      {
        cat: 'LIVROS IMPORTADOS',
        percent: '1,5'
      },
      {
        cat: 'LIVROS INTERESSE GERAL',
        percent: '1,0'
      },
      {
        cat: 'LIVROS TÉCNICOS',
        percent: '1,0'
      },
      {
        cat: 'MALAS & ACESSORIOS',
        percent: '1,5'
      },
      {
        cat: 'MODA & ACESSORIOS',
        percent: '1,0'
      },
      {
        cat: 'MÓVEIS - TODAS',
        percent: '2,0'
      },
      {
        cat: 'OPERACOES ESPECIAIS',
        percent: '1,0'
      },
      {
        cat: 'PAPELARIA',
        percent: '2,0'
      },
      {
        cat: 'PÁSCOA',
        percent: '1,0'
      },
      {
        cat: 'PCS',
        percent: '1,5'
      },
      {
        cat: 'PERFUMARIA',
        percent: '1,5'
      },
      {
        cat: 'PET SHOP',
        percent: '1,5'
      },
      {
        cat: 'RELOGIOS & PRESENTE',
        percent: '2,0'
      },
      {
        cat: 'SEGUROS E SERVIÇOS',
        percent: '1,0'
      },
      {
        cat: 'SINALIZAÇÃO E SEGURANÇA',
        percent: '1,5'
      },
      {
        cat: 'SUPLEMENTOS & VITAMINAS',
        percent: '1,5'
      },
      {
        cat: 'TABLETS, IMPRESSÃO & IMAGEM',
        percent: '1,5'
      },
      {
        cat: 'TELEFONIA',
        percent: '1,5'
      },
      {
        cat: 'TELEFONIA FIXA',
        percent: '1,0'
      },
      {
        cat: 'TENIS',
        percent: '1,0'
      },
      {
        cat: 'UTILIDADES DOMESTICAS',
        percent: '2,3'
      },
    ]
  } else if (lomadeeID == 5751) { // mobly
    lomadeeTable = [
      {
        cat: 'Vendas Mobly - Com Cupom',
        percent: '1,5'
      },
      {
        cat: 'Vendas Mobly - Sem Cupom',
        percent: '3,0'
      },

    ]
  } else if (lomadeeID == 11) { // livraria da travessa
    lomadeeTable = [
      {
        cat: 'Venda - Dvds',
        percent: '3,5'
      },
      {
        cat: 'Venda - Livros Importados',
        percent: '3,5'
      },
      {
        cat: 'Venda - Livros Nacionais',
        percent: '3,5'
      },

    ]
  } else if (lomadeeID == 5772) { // livraria da folha
    lomadeeTable = [
      {
        cat: 'DVDs, Blu-ray, Games, CDs',
        percent: '2,0'
      },
      {
        cat: 'Livros nacionais e importados',
        percent: '3,0'
      },

    ]
  } else if (lomadeeID == 5800) { // mega manute
    lomadeeTable = [
      {
        cat: 'Casa',
        percent: '2,0'
      },
      {
        cat: 'Eletrônicos',
        percent: '1,3'
      },
      {
        cat: 'Games',
        percent: '1,3'
      },
      {
        cat: 'Hardware',
        percent: '1,3'
      },
      {
        cat: 'Informática',
        percent: '1,3'
      },

    ]
  } else if (lomadeeID == 5876) { // livraria cultura
    lomadeeTable = [
      {
        cat: 'Brinquedos',
        percent: '1,5'
      },
      {
        cat: 'Diversos',
        percent: '1,5'
      },
      {
        cat: 'eBook',
        percent: '1,5'
      },
      {
        cat: 'Filmes',
        percent: '3,5'
      },
      {
        cat: 'Games',
        percent: '2,0'
      },
      {
        cat: 'Importados',
        percent: '4,0'
      },
      {
        cat: 'Livros Nacionais',
        percent: '4,0'
      },
      {
        cat: 'Música',
        percent: '2,0'
      },
      {
        cat: 'Revistas',
        percent: '1,5'
      },

    ]
  } else if (lomadeeID == 5755) { // extra
    lomadeeTable = [
      {
        cat: 'Ar e Ventilação',
        percent: '2,0'
      },
      {
        cat: 'Áudio',
        percent: '2,0'
      },
      {
        cat: 'Automotivo',
        percent: '2,0'
      },
      {
        cat: 'Bebês',
        percent: '2,0'
      },
      {
        cat: 'Beleza & Saúde',
        percent: '2,0'
      },
      {
        cat: 'Brinquedos',
        percent: '2,0'
      },
      {
        cat: 'Calçados',
        percent: '2,0'
      },
      {
        cat: 'Cama, Mesa e Banho',
        percent: '2,0'
      },
      {
        cat: 'Cine & Foto',
        percent: '2,0'
      },
      {
        cat: 'DVDs e Blu-Ray',
        percent: '2,0'
      },
      {
        cat: 'Eletrodomésticos',
        percent: '2,0'
      },
      {
        cat: 'Eletrônicos',
        percent: '2,0'
      },
      {
        cat: 'Eletroportáteis',
        percent: '2,0'
      },
      {
        cat: 'Esporte & Lazer',
        percent: '2,0'
      },
      {
        cat: 'Ferramentas',
        percent: '2,0'
      },
      {
        cat: 'Flores',
        percent: '2,0'
      },
      {
        cat: 'Futebol',
        percent: '2,0'
      },
      {
        cat: 'Games',
        percent: '2,0'
      },
      {
        cat: 'Informática',
        percent: '2,0'
      },
      {
        cat: 'Linha Industrial',
        percent: '2,0'
      },
      {
        cat: 'Livros',
        percent: '2,0'
      },
      {
        cat: 'Malas e Acessórios',
        percent: '2,0'
      },
      {
        cat: 'Marketplace',
        percent: '2,0'
      },
      {
        cat: 'Moda',
        percent: '2,0'
      },
      {
        cat: 'Móveis',
        percent: '2,0'
      },
      {
        cat: 'Papelaria',
        percent: '2,0'
      },
      {
        cat: 'Perfumaria',
        percent: '2,0'
      },
      {
        cat: 'Relógios',
        percent: '2,0'
      },
      {
        cat: 'Revistas',
        percent: '2,0'
      },
      {
        cat: 'Tablet',
        percent: '2,0'
      },
      {
        cat: 'Telefones & Celulares',
        percent: '2,0'
      },
      {
        cat: 'Utilidades Domésticas',
        percent: '2,0'
      },
    ]
  } else if (lomadeeID == 5754) { // ponto frio
    lomadeeTable = [
      {
        cat: 'Ar e Ventilação',
        percent: '2,0'
      },
      {
        cat: 'Áudio',
        percent: '2,0'
      },
      {
        cat: 'Automotivo',
        percent: '2,0'
      },
      {
        cat: 'Bebês',
        percent: '2,0'
      },
      {
        cat: 'Beleza & Saúde',
        percent: '2,0'
      },
      {
        cat: 'Brinquedos',
        percent: '2,0'
      },
      {
        cat: 'Calçados',
        percent: '2,0'
      },
      {
        cat: 'Cama, Mesa e Banho',
        percent: '2,0'
      },
      {
        cat: 'Cine & Foto',
        percent: '2,0'
      },
      {
        cat: 'DVDs e Blu-Ray',
        percent: '2,0'
      },
      {
        cat: 'Eletrodomésticos',
        percent: '2,0'
      },
      {
        cat: 'Eletrônicos',
        percent: '2,0'
      },
      {
        cat: 'Eletroportáteis',
        percent: '2,0'
      },
      {
        cat: 'Esporte & Lazer',
        percent: '2,0'
      },
      {
        cat: 'Ferramentas',
        percent: '2,0'
      },
      {
        cat: 'Flores',
        percent: '2,0'
      },
      {
        cat: 'Futebol',
        percent: '2,0'
      },
      {
        cat: 'Games',
        percent: '2,0'
      },
      {
        cat: 'Informática',
        percent: '2,0'
      },
      {
        cat: 'Linha Industrial',
        percent: '2,0'
      },
      {
        cat: 'Livros',
        percent: '2,0'
      },
      {
        cat: 'Malas e Acessórios',
        percent: '2,0'
      },
      {
        cat: 'Marketplace',
        percent: '2,0'
      },
      {
        cat: 'Moda',
        percent: '2,0'
      },
      {
        cat: 'Móveis',
        percent: '2,0'
      },
      {
        cat: 'Papelaria',
        percent: '2,0'
      },
      {
        cat: 'Perfumaria',
        percent: '2,0'
      },
      {
        cat: 'Relógios',
        percent: '2,0'
      },
      {
        cat: 'Revistas',
        percent: '2,0'
      },
      {
        cat: 'Tablet',
        percent: '2,0'
      },
      {
        cat: 'Telefones & Celulares',
        percent: '2,0'
      },
      {
        cat: 'Utilidades Domésticas',
        percent: '2,0'
      },
    ]
  } else if (lomadeeID == 5756) { // bahia
    lomadeeTable = [
      {
        cat: 'Ar e Ventilação',
        percent: '2,0'
      },
      {
        cat: 'Áudio',
        percent: '2,0'
      },
      {
        cat: 'Automotivo',
        percent: '2,0'
      },
      {
        cat: 'Bebês',
        percent: '2,0'
      },
      {
        cat: 'Beleza & Saúde',
        percent: '2,0'
      },
      {
        cat: 'Brinquedos',
        percent: '2,0'
      },
      {
        cat: 'Calçados',
        percent: '2,0'
      },
      {
        cat: 'Cama, Mesa e Banho',
        percent: '2,0'
      },
      {
        cat: 'Cine & Foto',
        percent: '2,0'
      },
      {
        cat: 'DVDs e Blu-Ray',
        percent: '2,0'
      },
      {
        cat: 'Eletrodomésticos',
        percent: '2,0'
      },
      {
        cat: 'Eletrônicos',
        percent: '2,0'
      },
      {
        cat: 'Eletroportáteis',
        percent: '2,0'
      },
      {
        cat: 'Esporte & Lazer',
        percent: '2,0'
      },
      {
        cat: 'Ferramentas',
        percent: '2,0'
      },
      {
        cat: 'Flores',
        percent: '2,0'
      },
      {
        cat: 'Futebol',
        percent: '2,0'
      },
      {
        cat: 'Games',
        percent: '2,0'
      },
      {
        cat: 'Informática',
        percent: '2,0'
      },
      {
        cat: 'Linha Industrial',
        percent: '2,0'
      },
      {
        cat: 'Livros',
        percent: '2,0'
      },
      {
        cat: 'Malas e Acessórios',
        percent: '2,0'
      },
      {
        cat: 'Marketplace',
        percent: '2,0'
      },
      {
        cat: 'Moda',
        percent: '2,0'
      },
      {
        cat: 'Móveis',
        percent: '2,0'
      },
      {
        cat: 'Papelaria',
        percent: '2,0'
      },
      {
        cat: 'Perfumaria',
        percent: '2,0'
      },
      {
        cat: 'Relógios',
        percent: '2,0'
      },
      {
        cat: 'Revistas',
        percent: '2,0'
      },
      {
        cat: 'Tablet',
        percent: '2,0'
      },
      {
        cat: 'Telefones & Celulares',
        percent: '2,0'
      },
      {
        cat: 'Utilidades Domésticas',
        percent: '2,0'
      },
    ]
  }


  return lomadeeTable;
}

// Função que le os dados do usuario no banco da praça
function readFromDB(callback) {
  
  // geting the cookies and insiding into a array
  var customer_info = getStorage("customer_info");
  var customer_pswd = getStorage("customer_pswd");
  var info_type = getStorage("info_type");
  var product_id = getStorage("product_id");
  var row = '';
  
  if (customer_info != null && customer_pswd != null && info_type != null && product_id != null) {
    row = {
      'customer_info': customer_info,
      'customer_pswd': customer_pswd,
      'info_type': info_type,
      'product_id': product_id,
      'row_id': '1',
    }
  }

  callback(row);
}

// Função para recuperar os dados do cliente final e guardar em um array
function returnMyCustomerInArray(callback) {
  readFromDB(function(dbInfo){
    getUserID(function(userIdInfo){
      $.ajax({
        url: 'http://rest.genxpression.com/GenXpressionWSRest/ReturnCustomer',
        type: 'POST',
        data: {MyCustomer: dbInfo.customer_info, InfoType: dbInfo.info_type, CustomerPSWD: dbInfo.customer_pswd, UserID: userIdInfo[0], PSWD: userIdInfo[1], ResponseType: "1"},
        dataType: 'json',
        success: function(data) {
          $.each(data, function(index, value) {
            if (value.RequestStatus == "Success") {
              var arr_return = [value.CustomerID];
              callback(arr_return);
            }
          });
        }
      });
    });
  });
}

// Função para recuperar os dados do cliente final
function returnMyCustomerInfo(callback) {
  readFromDB(function(dbInfo){
    getUserID(function(userIdInfo){
      $.ajax({
        url: 'http://rest.genxpression.com/GenXpressionWSRest/ReturnCustomer',
        type: 'POST',
        data: {MyCustomer: dbInfo.customer_info, InfoType: dbInfo.info_type, CustomerPSWD: dbInfo.customer_pswd, UserID: userIdInfo[0], PSWD: userIdInfo[1], ResponseType: "1"},
        dataType: 'json',
        success: function(data) {
          $.each(data, function(index, value) {
            if (value.RequestStatus == "Success") {
              callback(value);
            }
          });
        }
      });
    });
  });
}

// Função que pega o percentual de desconto da empresa
function getMyDiscount(callback, BranchCode) {
  $.support.cors = true;

  getUserID(function(returnUserID){
    $.ajax({
      url: 'http://rest.genxpression.com/GenXpressionWSRest/RetrieveBranchSimpleRules',
      type: 'POST',
      data: {RootID: ROOT_ID, BranchID: BranchCode, UserID: returnUserID[0], PSWD: returnUserID[1]},
      success: function(data) {
        var percentualDiscount = [];

        $.each(data, function(index, value){
          if (value.RequestStatus == "Success") {
            arrDiscount.push(arr_Branch_split[1] + ';' + value2.Percentual);
          }
        });

        callback(percentualDiscount);
      }
    });
  });
}

// Função que escolhe o icone e a cor do estabelecimento
function getMyIconAndColor(est) {
  var myReturn = [];

  var lowerEst = est.toLowerCase();

  if (lowerEst.indexOf('farm') !== -1 || lowerEst.indexOf('clínica') !== -1 || lowerEst.indexOf('médica') !== -1 || lowerEst.indexOf('hospital') !== -1) {
    myReturn.push('plus-square');
    myReturn.push('red');
  } else if (lowerEst.indexOf('mercado') !== -1) {
    myReturn.push('shopping-cart');
    myReturn.push('light-blue');
  } else if (lowerEst.indexOf('moda') !== -1 || lowerEst.indexOf('roupa') !== -1 || lowerEst.indexOf('calçado') !== -1 || lowerEst.indexOf('beleza') !== -1) {
    myReturn.push('shopping-bag');
    myReturn.push('pink lighten-1');
  } else if (lowerEst.indexOf('alimento') !== -1 || lowerEst.indexOf('lanchonete') !== -1 || lowerEst.indexOf('pizzaria') !== -1 || lowerEst.indexOf('restaurante') !== -1
    || lowerEst.indexOf('lanchão') !== -1 || lowerEst.indexOf('food') !== -1) {
    myReturn.push('cutlery');
    myReturn.push('green lighten-1');
  } else if (lowerEst.indexOf('animal') !== -1 || lowerEst.indexOf('petshop') !== -1 || lowerEst.indexOf('pet ') !== -1) {
    myReturn.push('paw');
    myReturn.push('amber');
  } else if (lowerEst.indexOf('hotel') !== -1) {
    myReturn.push('bed');
    myReturn.push('teal');
  } else if (lowerEst.indexOf('alameda de serviços') !== -1) {
    myReturn.push('coffee');
    myReturn.push('indigo');
  } else if (lowerEst.indexOf('ar e ventilação') !== -1) {
    myReturn.push('leaf');
    myReturn.push('green darken-1');
  } else if (lowerEst.indexOf('festas') !== -1) {
    myReturn.push('birthday-cake');
    myReturn.push('cyan darken-1');
  } else if (lowerEst.indexOf('áudio') !== -1) {
    myReturn.push('headphones');
    myReturn.push('teal accent-3');
  } else if (lowerEst.indexOf('automotivo') !== -1) {
    myReturn.push('car');
    myReturn.push('cyan accent-3');
  } else if (lowerEst.indexOf('bebê') !== -1) {
    myReturn.push('child');
    myReturn.push('yellow accent-4');
  } else if (lowerEst.indexOf('brinquedos') !== -1) {
    myReturn.push('puzzle-piece');
    myReturn.push('green');
  } else if (lowerEst.indexOf('cine & foto') !== -1) {
    myReturn.push('film');
    myReturn.push('blue');
  } else if (lowerEst.indexOf('decoração') !== -1) {
    myReturn.push('gift');
    myReturn.push('red');
  } else if (lowerEst.indexOf('dvds e blu-ray') !== -1) {
    myReturn.push('floppy-o');
    myReturn.push('purple lighten-1');
  } else if (lowerEst.indexOf('ebooks') !== -1) {
    myReturn.push('book');
    myReturn.push('orange');
  } else if (lowerEst.indexOf('eletrodomésticos') !== -1) {
    myReturn.push('television');
    myReturn.push('cyan');
  } else if (lowerEst.indexOf('eletroportáteis') !== -1) {
    myReturn.push('plug');
    myReturn.push('light-green');
  } else if (lowerEst.indexOf('esporte') !== -1) {
    myReturn.push('futbol-o');
    myReturn.push('red lighten-1');
  } else if (lowerEst.indexOf('ferramentas') !== -1) {
    myReturn.push('wrench');
    myReturn.push('pink lighten-1');
  } else if (lowerEst.indexOf('game') !== -1) {
    myReturn.push('gamepad');
    myReturn.push('yellow darken-2');
  } else if (lowerEst.indexOf('informática') !== -1) {
    myReturn.push('laptop');
    myReturn.push('light-green');
  } else if (lowerEst.indexOf('musicais') !== -1 || lowerEst.indexOf('música') !== -1) {
    myReturn.push('music');
    myReturn.push('deep-purple lighten-1');
  } else if (lowerEst.indexOf('industrial') !== -1) {
    myReturn.push('industry');
    myReturn.push('brown');
  } else if (lowerEst.indexOf('livro') !== -1) {
    myReturn.push('book');
    myReturn.push('orange');
  } else if (lowerEst.indexOf('malas') !== -1) {
    myReturn.push('plane');
    myReturn.push('light-blue lighten-1');
  } else if (lowerEst.indexOf('natal') !== -1) {
    myReturn.push('tree');
    myReturn.push('red');
  } else if (lowerEst.indexOf('papelaria') !== -1) {
    myReturn.push('pencil-square');
    myReturn.push('amber accent-3');
  } else if (lowerEst.indexOf('perfumaria') !== -1) {
    myReturn.push('diamond');
    myReturn.push('purple');
  } else if (lowerEst.indexOf('relógio') !== -1) {
    myReturn.push('clock-o');
    myReturn.push('pink lighten-1');
  } else if (lowerEst.indexOf('tablet') !== -1) {
    myReturn.push('tablet');
    myReturn.push('indigo lighten-1');
  } else if (lowerEst.indexOf('telefones') !== -1 || lowerEst.indexOf('celulares') !== -1) {
    myReturn.push('mobile');
    myReturn.push('purple lighten-1');
  } else if (lowerEst.indexOf('tvs') !== -1 || lowerEst.indexOf('vídeos') !== -1) {
    myReturn.push('television');
    myReturn.push('cyan');
  } else {
    myReturn.push('home');
    myReturn.push('cyan lighten-1');
  }

  return myReturn;
}

// Função do Google Maps, eu te odeio mas te amo ao mesmo tempo
function iniMapizinho(LatV, LonV) {
  var defaultLatLng = new google.maps.LatLng(LatV, LonV);

  drawMap(defaultLatLng);     
}

function drawMap(latlng) {
  var myOptions = {
      zoom: 15,
      center: latlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true
  };
  var map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
  // Add an overlay to the map of current lat/lng
  var marker = new google.maps.Marker({
      position: latlng,
      map: map,
      title: "Empresa"
  });
}

// Função que monta o nome das categorias
function findCategories() {
  // Colocando no array o nome das categorias
  var cat_arr = [
  'Alameda de Serviços',
  'Ar e Ventilação',
  'Artigos para Festas',
  'Áudio',
  'Automotivo',
  'Bebês',
  'Beleza & Saúde',
  'Brinquedos',
  'Calçados',
  'Cama, Mesa e Banho',
  'Casa e Construção',
  'Cine & Foto',
  'Decoração',
  'DVDs e Blu-Ray',
  'eBooks',
  'Eletrodomésticos',
  'Eletroportáteis',
  'Esporte & Lazer',
  'Ferramentas',
  'Games',
  'Informática',
  'Instrumentos Musicais',
  'Linha Industrial',
  'Livros',
  'Malas & Mochilas',
  'Moda',
  'Móveis',
  'Natal',
  'Papelaria',
  'Perfumaria',
  'Pet Shop',
  'Produtos de Limpeza',
  'Relógios',
  'Tablets',
  'Telefones & Celulares',
  'TVs e Video',
  'Utilidades Domésticas'
  ];

  var color_arr = [];

  // retirando todos os li do ul para não ter duplicados
  $('#cat-collection li').remove();

  // Listando as categorias
  $.each(cat_arr, function(index, value){
    color_arr = getMyIconAndColor(value);

    $('#cat-collection').append(
      '<a href="#premium" data-transition="slide" class="ancor-li">' +
      '<li class="collection-item avatar">' +
        '<i class="fa fa-' + color_arr[0] + ' ' + color_arr[1] + ' circle"></i>' + 
        '<span class="title">' + value + '</span>' + 
        '<a href="#!" class="secondary-content"><i class="fa fa-ellipsis-v"></i></a>' +
      '</li>' +
      '</a>'
    );
  });
}

// Essa função pega o número do estado e transforma em nome com um SHAZAM
function getUfByNum(estNum) {
  var estName;
  if (estNum == 12) {
    estName = "AC";
  } else if (estNum == 27) {
    estName = "AL";
  } else if (estNum == 13) {
    estName = "AM";
  } else if (estNum == 16) {
    estName = "AP";
  } else if (estNum == 29) {
    estName = "BA";
  } else if (estNum == 23) {
    estName = "CE";
  } else if (estNum == 53) {
    estName = "DF";
  } else if (estNum == 32) {
    estName = "ES";
  } else if (estNum == 52) {
    estName = "GO";
  } else if (estNum == 21) {
    estName = "MA";
  } else if (estNum == 31) {
    estName = "MG";
  } else if (estNum == 50) {
    estName = "MS";
  } else if (estNum == 51) {
    estName = "MT";
  } else if (estNum == 15) {
    estName = "PA";
  } else if (estNum == 25) {
    estName = "PB";
  } else if (estNum == 26) {
    estName = "PE";
  } else if (estNum == 22) {
    estName = "PI";
  } else if (estNum == 41) {
    estName = "PR";
  } else if (estNum == 33) {
    estName = "RJ";
  } else if (estNum == 24) {
    estName = "RN";
  } else if (estNum == 11) {
    estName = "RO";
  } else if (estNum == 14) {
    estName = "RR";
  } else if (estNum == 43) {
    estName = "RS";
  } else if (estNum == 42) {
    estName = "SC";
  } else if (estNum == 28) {
    estName = "SE";
  } else if (estNum == 35) {
    estName = "SP";
  } else if (estNum == 17) {
    estName = "TO";
  } else {
    estName = "";
  }

  return estName;
}

// Essa função envia email para o email do cliente
function sendMailToUser() {
  returnMyCustomerInfo(function(returnEmail){
    if (returnEmail.PersonalEmail != null && returnEmail.PersonalEmail != '') {
      var prodName = $('#product .product-card .card-title').html();
      var prodCode = $('#voucher-code-copy').html();
      var messageVar = "Você adquiriu o produto " + prodName + "\nSegue o código do seu cupom: " + prodCode + "\nAgradecemos a sua preferência!";

      $.ajax({
        url: 'http://rest.genxpression.com/GenXpressionWSRest/SendEmail',
        type: 'POST',
        data: {MailFrom: EMAIL_SYSTEM, MailTo: returnEmail.PersonalEmail, EmailCopy: '', Subject: 'Aqui está o código do seu cupom!', MyString: messageVar, SMTP: 'smtp.sendgrid.net', SMTPLogin: 'genxpression', SMTPPSWD: 'notredame123', SMTPPort: '587', IsBodyHtml: 'False', ResponseType: "1"},
        dataType: 'json',
        cache: false,
        success: function(data) {   
          if (data == "Success") {
            Materialize.toast('E-mail enviado com sucesso!', 3000);
          } else {
            Materialize.toast('Aconteceu algo ao tentar enviar o e-mail.', 3000);
          }
        },
        error: function(errorData) {
          Materialize.toast('Aconteceu algo ao tentar enviar o e-mail.', 3000);
        }
      });
    } else {
      Materialize.toast('E-mail não configurado.', 3000);
    }
    
  });
  
}

// Evento de clique no botao de login
$(document).on('submit', '.login-form', function(e){
  e.preventDefault();
  
  $('#login #login-load').show('fast');
  $('#login .login-itens').hide('fast');

  var customerInfoVar = $('#login-username').val();
  var infoTypeVar = $('input[name=info-type]:checked').val();
  var customerPassVar = $('#login-pass').val();

  // Função abaixo pega o ProductID
  getProdId(function(ProdIdReturn){
    // Função abaixo pega userId e PassWord
    getUserID(function(returnUserID){
      /*
        * Parametros:
          - CustomerInfo: email, matricula, CPF que o cliente digitou
          - InfoType: email-1, matricula-2, cpf-3
          - CustomerPSWD:senha que o cliente digitou
          - ProductID: o productID descoberto na função getProdId()
          - Origin: sempre '1'
          - UserID: userID descoberto na função getUserID()
          - PSWD: Password descoberto na função getUserID()
      */
      $.ajax({
        url: 'http://rest.genxpression.com/GenXpressionWSRest/CustomerLogInWithProductReg',
        type: 'POST',
        data: {CustomerInfo: customerInfoVar, InfoType: infoTypeVar, CustomerPSWD: customerPassVar, ProductID: ProdIdReturn, Origin: '1', UserID: returnUserID[0], PSWD: returnUserID[1]},
        success: function(data) {
          $.each(data, function (index, value) {
            if (value.RequestStatus == "Success") {
              createStorage('product_id', ProdIdReturn);
              createStorage('customer_info', customerInfoVar);
              createStorage('customer_pswd', customerPassVar);
              createStorage('info_type', infoTypeVar);


              $('#extratos .extract-table tbody tr').remove(); // Remove a tabela de extrato
              $('#est-ul li').remove(); // Remove os estabelecimentos

              returnCustomer(); // Função que carrega dados do usuario
              loadBalance(); // Função que carrega os pontos
              allBalance(); // Função que o estrato
              LoadBranch(); // Função que os estabelecimentos
              
              // geting the customerID
              $.ajax({
                url: 'http://rest.genxpression.com/GenXpressionWSRest/ReturnCustomer',
                type: 'POST',
                data: {MyCustomer: customerInfoVar, InfoType: infoTypeVar, CustomerPSWD: customerPassVar, UserID: returnUserID[0], PSWD: returnUserID[1], ResponseType: "1"},
                dataType: 'json',
                success: function(data) {
                  $.each(data, function(index, value) {
                    if (value.RequestStatus == "Success") {
                      // Salvando o customerID em um cookie para facilitar
                      createStorage("CustomerID", value.CustomerID);

                      // Criando o hash de login
                      doMyHashLogin(value.CustomerID, customerPassVar, function(returnHash){
                        createStorage("HLID", returnHash);
                      });

                      window.location.replace('#pageone');

                      $('#login #login-load').hide('fast');
                      $('#login .login-itens').show('fast');

                      // Criando no onesignal só se o plugins estiver definido
                      // if (typeof plugins != 'undefined') {
                      //   window.plugins.OneSignal.sendTag("customerID", value.CustomerID);
                      // }                              
                    }
                  });
                },
                error: function(dataError) {
                  openAlert('Login não realizado. Tente mais tarde.\nMotivo: ' + dataError.responseText, 'Ops', '', '');

                  $('#login #login-load').hide('fast');
                  $('#login .login-itens').show('fast');
                }
              });
              
            } else {
              openAlert('Usuário ou senha incorretos', 'Login inválido', '', '');

              $('#login #login-load').hide('fast');
              $('#login .login-itens').show('fast');
            }
          });
        },
        error: function() {
          alert('Erro ao tentar fazer login');

          $('#login #login-load').hide('fast');
          $('#login .login-itens').show('fast');
        }
      });
    }); 
  });
});

// Evento que pega o ID do estabelecimento ao clicar
$('#est-ul').on('click', 'li a[href=#est-det]', function(){
  $.support.cors = true;

  var est_id = this.id;
  $('.branch-id-input').val(est_id);

  readBranch();
});

// Evento que apaga o banco de dados ao sair
$('#logout').click(function(){
  eraseStorage("CustomerID"),
  eraseStorage("HLID"),
  eraseStorage('product_id');
  eraseStorage('customer_info');
  eraseStorage('customer_pswd');
  eraseStorage('info_type');
  window.location.replace('#login');
});

$('a[href=#top-sale]').click(function(){
  buildTopOffers();
})

$('a[href=#get-online]').click(function(){
  buildOnlineShop();

});

// evento q carrega o extrato de economia
$('#cashback-tab').click(function(){
  if ($('#extratos #cashback .cashback-table .collection-item').length) {
    // faz nada pq ja ta preenchido a tabela
  } else {
    var labelType;
    var labelText;
    var clickCall;
    var opacityLevel;

    date = new Date();
    let month = date.getUTCMonth() + 1;
    if (month < 10) {
      month = '0' + month;
    }
    let day = date.getUTCDate();
    let year = date.getUTCFullYear();
    let newDate = year + '-' + month + '-' + day;

    allBalanceOption(25, '2000-01-01', newDate, 'table', function(balanceReturn){

      if (balanceReturn.Status == 2) {
        labelType = 'amber';
        labelText = "Usado";
        clickCall = '';
        opacityLevel = '.6';
      } else if (balanceReturn.Status == 3) {
        labelType = 'red';
        labelText = "Expirado";
        clickCall = '';
        opacityLevel = '.6';
      } else if (balanceReturn.Status == 1) {
        labelType = 'green';
        labelText = "Disponível";
        clickCall = 'openMyVoucher(\'R$ '+addCommas(balanceReturn['Discount'].toFixed(2))+'\', \'\', \''+ROOT_ID+balanceReturn.Voucher+'\', \'another\')';
        opacityLevel = '1';
      } else {
        labelType = 'light-blue';
        labelText = "Não informado";
        clickCall = '';
        opacityLevel = '.6';
      }

      $('#extratos .cashback-table').prepend(
        '<li class="collection-item avatar" style="padding: 10px 20px !important;opacity:'+opacityLevel+';" data-voucher-id="'+balanceReturn.Voucher+'" onclick="'+clickCall+'">\
          <span class="title">R$ '+addCommas(balanceReturn['Discount'].toFixed(2))+'</span><small> de desconto</small>\
          <p>'+balanceReturn.CompanyFantasy+'<br>\
             '+balanceReturn.Column1+'\
          </p>\
          <a href="#!" class="secondary-content"><span class="new badge '+labelType+'" data-badge-caption=" ">'+labelText+'</span></a>\
        </li>'
      );
    });
  }
});

// evento q carrega o extrato de premios
$('a[href=#ticket]').click(function(){
  // cleaning the div to insert news
  $('#ticket .premium-ok-table li').remove();
  $('#ticket .premium-used-table li').remove();
  // showing the loading
  $('#ticket .loading-div').show();

  var labelType;
  var labelText;
  var clickCall;
  var opacityLevel;

  date = new Date();
  let month = date.getUTCMonth() + 1;
  if (month < 10) {
    month = '0' + month;
  }
  let day = date.getUTCDate();
  let year = date.getUTCFullYear();
  let newDate = year + '-' + month + '-' + day;

  allBalanceOption(32, '2000-01-01', newDate, 'premium', function(balanceReturn){
    console.log(balanceReturn);
    if (balanceReturn.Status == 2) {
      labelType = 'amber';
      labelText = "Usado";
      clickCall = '';
      opacityLevel = '.6';
    } else if (balanceReturn.Status == 3) {
      labelType = 'red';
      labelText = "Expirado";
      clickCall = '';
      opacityLevel = '.6';
    } else if (balanceReturn.Status == 1) {
      labelType = 'green';
      labelText = "Disponível";
      clickCall = 'openMyVoucher(\''+balanceReturn.Title+'\', \'img/tickets.png\', \''+balanceReturn['Voucher Número']+'\', \'prod\')';
      opacityLevel = '1';
    } else {
      labelType = 'light-blue';
      labelText = "Não informado";
      clickCall = '';
      opacityLevel = '.6';
    }

    $('#ticket .premium-ok-table').prepend(
      '<li class="collection-item avatar" style="padding: 10px 20px !important;opacity:'+opacityLevel+';" onclick="'+clickCall+'">\
        <span class="title">'+balanceReturn.Title+'</span>\
        <p>'+balanceReturn.Uso+'<br>\
        </p>\
        <a href="#!" class="secondary-content"><span class="new badge '+labelType+'" data-badge-caption=" ">'+labelText+'</span></a>\
      </li>'
    );
  });

  allBalanceOption(35, '2000-01-01', newDate, 'premium', function(balanceReturn){
    console.log(balanceReturn);
    if (balanceReturn.Status == 2) {
      labelType = 'amber';
      labelText = "Usado";
      clickCall = '';
      opacityLevel = '1';
    } else if (balanceReturn.Status == 3) {
      labelType = 'red';
      labelText = "Expirado";
      clickCall = '';
      opacityLevel = '1';
    } else if (balanceReturn.Status == 1) {
      labelType = 'green';
      labelText = "Disponível";
      clickCall = 'openMyVoucher(\''+balanceReturn.Title+'\', \'img/tickets.png\', \''+balanceReturn['Voucher Número']+'\', \'prod\')';
      opacityLevel = '1';
    } else {
      labelType = 'light-blue';
      labelText = "Não informado";
      clickCall = '';
      opacityLevel = '1';
    }

    // Arumando as variaveis
    var vPRemove = addCommas(balanceReturn['Pontos Retirados'].toFixed(2));

    $('#ticket .premium-used-table').prepend(
      '<li class="collection-item avatar" style="padding: 10px 20px !important;opacity:'+opacityLevel+';" onclick="'+clickCall+'">\
        <p><small>Usado em: '+balanceReturn['Voucher Usado Em']+'</small></p>\
        <span class="title">'+balanceReturn['Voucher Número']+'</span>\
        <p>Usado na empresa: '+balanceReturn.Empresa+'<br>\
           Pontos retirados: '+ vPRemove +'<br>\
        </p>\
        <a href="#!" class="secondary-content"><span class="new badge '+labelType+'" data-badge-caption=" ">'+labelText+'</span></a>\
      </li>'
    );

  });
});

// evento que carrega as categorias ao clicar no item do menu
$('a[href=#categories]').click(function(){
  createMyCategories();
});

// Ao clicar em uma categoria, voltar para primeira pagina e carregar as subcategorias.
// Se o deptoID for igual a zero, carregar os premios, pois foi selecionado todas as categorias
$(document).on('click', '#categories-content .collection-item', function(){
  let deptoId = $(this).attr('data-cat-id');

  // Retornando para a primeira pagina
  $('#pagination').val('1');

  if (deptoId == 0) {
    $('#deptID').val('0');
    createMyStore('false');
  } else {
    $('#deptID').val(deptoId);
    createMySubCategories(deptoId);
  }
});

// Ao clicar para voltar na pagina de cupom, apagar o cupom atual
$(document).on('click', '.voucher-back', function(){
  $('#voucher-container .discount').html('');
  $('#voucher-container h4').html('');
  $('#voucher-container #voucher-code-copy').html('');
  $('#voucher-container img').attr('src', '');
});

// Ao clicar em uma subcategoria, voltar para primeira pagina e carregar os premios
$(document).on('click', '#sub-categories-content .collection-item', function(){
  let subDeptoId = $(this).attr('data-subcat-id');

  // Retornando para a primeira pagina
  $('#pagination').val('1');
  
  $('#subDeptID').val(subDeptoId);

  createMyStore('false');
});

// Passando para proxima pagina
$(document).on('click', '.more-one-page', function(){
  let currentPag = $('#pagination').val();

  $('#pagination').val(++currentPag);

  createMyStore('true');
});

// Carregando o produto
$(document).on('click', '#product-collection .collection-item', function(){
  openMyProductModal($(this));
});

$(document).on('click', '.prod-back', function(){
  // Tirando as informações do produtos
  $("#owl-demo").trigger('destroy.owl.carousel').removeClass('owl-carousel owl-loaded');;
  $(".carousel-display #owl-demo").remove();

  $('#product .brand-logo').html('');

  let displayVar = $('#product .product-card');
  displayVar.find('.card-title').html('');
  displayVar.find('.card-price').html('');
  displayVar.find('.card-desc').html('');
  displayVar.find('.card-small-desc').html('');
  displayVar.find('.card-branch span').html('');
});

// Função que formata o numero
function addCommas(nStr) {
  nStr += '';
  x = nStr.split('.');
  x1 = x[0];
  x2 = x.length > 1 ? ',' + x[1] : '';

  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + '.' + '$2');
  }
  return x1 + x2;
}

// Formata o numero para contas (formato americano)
function addCommasInverse(nStr) {
  var finalStr = nStr.replace('.', ''); 
  finalStr = finalStr.replace(',', '.');

  return finalStr
}

function truncString(str, max, add){
 add = add || '...';
 return (typeof str === 'string' && str.length > max ? str.substring(0,max)+add : str);
};

// Função que abre (type: _system or _blank)
function openBrowser(type, target) {
  if (type == 'est') {
    var url = $('#est-det .princ-card p a').attr('data-site');
  } else if (type == 'offer') {
    var url = target.attr('data-site');
  }
 
 var target = '_system';
 var options = "location=yes"
 var ref = cordova.InAppBrowser.open(url, target, options);

 ref.addEventListener('loadstart', loadstartCallback);
 ref.addEventListener('loadstop', loadstopCallback);
 ref.addEventListener('loadloaderror', loaderrorCallback);
 ref.addEventListener('exit', exitCallback);

 function loadstartCallback(event) {
    console.log('Loading started: '  + event.url)
 }

 function loadstopCallback(event) {
    console.log('Loading finished: ' + event.url)
 }

 function loaderrorCallback(error) {
    console.log('Loading error: ' + error.message)
 }

 function exitCallback() {
    console.log('Browser is closed...')
 }
}

// Função que abre um alerta nativo
function openAlert(content, title, callback, button) {
    if (title == '') {
        title = 'Alerta';
    }
    if (callback == '') {
        callback = doNothingPlease();
    }
    if (button == '') {
        button = "OK";
    }
    navigator.notification.alert(content, callback, title, button);
}

// Função q nao faz nada
function doNothingPlease() {
    
}

function copyToClipboard(elem) {
  // create hidden text element, if it doesn't already exist
  var targetId = "_hiddenCopyText_";
  var isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
  var origSelectionStart, origSelectionEnd;
  if (isInput) {
      // can just use the original source element for the selection and copy
      target = elem;
      origSelectionStart = elem.selectionStart;
      origSelectionEnd = elem.selectionEnd;
  } else {
      // must use a temporary form element for the selection and copy
      target = document.getElementById(targetId);
      if (!target) {
          var target = document.createElement("textarea");
          target.style.position = "absolute";
          target.style.left = "-9999px";
          target.style.top = "0";
          target.id = targetId;
          document.body.appendChild(target);
      }
      target.textContent = elem.textContent;
  }
  // select the content
  var currentFocus = document.activeElement;
  target.focus();
  target.setSelectionRange(0, target.value.length);
  
  // copy the selection
  var succeed;
  try {
      succeed = document.execCommand("copy");
  } catch(e) {
      succeed = false;
  }
  // restore original focus
  if (currentFocus && typeof currentFocus.focus === "function") {
      currentFocus.focus();
  }
  
  if (isInput) {
      // restore prior selection
      elem.setSelectionRange(origSelectionStart, origSelectionEnd);
  } else {
      // clear temporary content
      target.textContent = "";
  }
  return succeed;
}

function copyToClipboardMsg(elem) {
  var succeed = copyToClipboard(elem);
  var msg;
  if (!succeed) {
    msg = "A cópia automática não está disponível para este dispositivo. Por favor, copie manualmente."
  } else {
    msg = "Código copiado!"
  }
  
  Materialize.toast(msg, 3000);
}

function openNewPage(page, effect) {
  // window.location.replace(page)
  $(':mobile-pagecontainer').pagecontainer('change', page, {
    transition: effect,
    changeHash: false,
    reverse: true
  });
}

// ---------------------- Cookies
function createCookie(name, value, days) {
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    var expires = "; expires=" + date.toGMTString();
  }
  else var expires = "";

  document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length,c.length);
    }
  }
  return "";
}

function eraseCookie(name) {
  createCookie(name, "", -1);
}

// ------------------ WebStorage
function createStorage(name, value) {
    localStorage.setItem(name, value);
}

function getStorage(name) {
    return localStorage.getItem(name);
}

function eraseStorage(name) {
    localStorage.removeItem(name);
}