function getXmlHttp() {
    var xmlhttp;
    try {
        xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
    } catch (e) {
        try {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        } catch (E) {
            xmlhttp = false;
        }
    }
    if (!xmlhttp && typeof XMLHttpRequest != 'undefined') {
        xmlhttp = new XMLHttpRequest();
    }
    return xmlhttp;
}

function setAjaxHeaders(req){
    req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    req.setRequestHeader("X-CSRFToken", document.getElementById('csrf_token').value);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    return req
}

var ajaxSender = function(updatedModel) {
    var req = getXmlHttp();

    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            if (req.status == 200) {
                var response = JSON.parse(req.responseText);
                var table = JSON.parse(response.content.models);
                var model_id = response.content.model;
                var html_table = document.createElement('table');
                html_table.setAttribute('id', 'table_table');
                html_table.setAttribute('data-model', model_id);
                html_table.setAttribute('border', 1);

                var addLastRow = false;
                if (response.content.is_empty) {
                    addLastRow = false;
                } else {
                    addLastRow = true;
                }

                var adding_row;
                for (var t_row in table) {
                    var h_row = document.createElement('tr');
                    html_table.appendChild(h_row);
                    adding_row = document.createElement('tr');
                    adding_row.setAttribute('style', "height: 20px;");
                    adding_row.setAttribute('data-row-id', 0);
                    var row = document.createElement('tr');
                    row.setAttribute('data-row-id', table[t_row].row_id);
                    for (var t_cell in table[t_row].row) {
                        var cell = document.createElement('td');
                        var l_cell = document.createElement('td');
                        cell.setAttribute('class', 'cell');
                        l_cell.setAttribute('class', 'cell');
                        var inner_div = document.createElement('div');
                        inner_div.setAttribute('data-field', t_cell);
                        inner_div.setAttribute('data-type', table[t_row].row[t_cell][1]);
                        l_cell.appendChild(inner_div.cloneNode(false));
                        inner_div.innerHTML = table[t_row].row[t_cell][0];
                        var h_cell = document.createElement('td');
                        h_cell.innerHTML = table[t_row].row[t_cell][2];
                        h_row.appendChild(h_cell);
                        cell.appendChild(inner_div);
                        if (table[t_row].row[t_cell][1] == 'id') {
                            h_row.insertBefore(h_cell, h_row.firstChild);
                            row.insertBefore(cell, row.firstChild);
                            adding_row.insertBefore(l_cell, adding_row.firstChild);
                        } else {
                            h_row.appendChild(h_cell);
                            row.appendChild(cell);
                            adding_row.appendChild(l_cell);
                        }

                    }
                    html_table.replaceChild(h_row, html_table.firstChild);
                    html_table.appendChild(row);
                }
                if (addLastRow) {
                    html_table.appendChild(adding_row);
                }
                var table_container = document.getElementById('table');
                if (document.getElementById('table_table')) {
                    table_container.replaceChild(html_table, document.getElementById('table_table'));
                } else {
                    table_container.appendChild(html_table);
                }

                var cells = document.getElementsByClassName('cell');

                var editHandler = function() {
                    if (this.tagName != 'input') {
                        var input_field = document.createElement('input');
                        var cell_type = this.firstChild.getAttribute('data-type');
                        var data_field = this.firstChild.getAttribute('data-field');
                        if (cell_type == 'text') {
                            input_field.type = 'text';
                        } else if (cell_type == 'int') {
                            input_field.type = 'number';
                        } else if (cell_type == 'date') {
                            input_field.type = 'text';
                            input_field.id = 'date';
                        }
                        input_field.setAttribute('data-type', cell_type);
                        input_field.setAttribute('data-field', data_field);
                        input_field.setAttribute('value', this.firstChild.innerHTML);
                        this.replaceChild(input_field, this.firstChild);

                        this.firstChild.focus();
                        this.onclick = null;
                        calendar.set("date");
                        this.firstChild.click(true);

                        var replace = function() {
                            var newDiv = document.createElement('div');
                            var input;
                            if (document.getElementById('date')) {
                                input = document.getElementById('date');
                            } else {
                                input = this;
                            }

                            var value = input.value;
                            newDiv.innerHTML = value;
                            var data_type = input.getAttribute('data-type');
                            newDiv.setAttribute('data-type', data_type);

                            var field = input.getAttribute('data-field');
                            newDiv.setAttribute('data-field', field);
                            newDiv.setAttribute('id', 'changed');

                            input.parentNode.onclick = editHandler;
                            input.parentNode.replaceChild(newDiv, input);
                            var req = getXmlHttp();

                            var id = newDiv.parentNode.parentNode.getAttribute('data-row-id');
                            var model = newDiv.parentNode.parentNode.parentNode.getAttribute('data-model');
                            req.onreadystatechange = function() {
                                if (req.readyState == 4) {
                                    if (req.status == 200) {
                                        var response = JSON.parse(req.responseText);
                                        var error = response.content.error;
                                        var error_box = document.getElementById('error-box');
                                        if (error) {
                                            var errored_cell = document.getElementById('changed');
                                            errored_cell.setAttribute('style', 'background-color: red; height: 20px');
                                            error_box.innerHTML = error;
                                        } else {
                                            error_box.innerHTML = '';
                                            var model_item = document.getElementById(model);
                                            model_item.click();
                                        }
                                    }
                                }
                            };
                            
                            if (value){
                                req.open('POST', 'update_cell', true);
                                req = setAjaxHeaders(req)
                                req.send("model=" + model + "&field=" + field + "&id=" + id + "&value=" + value);
                            }
                        };


                        if (cell_type == 'text' || cell_type == 'int') {
                            this.firstChild.onblur = replace;
                        } else if (cell_type == 'date') {
                            this.firstChild.onchange = replace;
                        }

                        calendar.onhide = replace;
                    }
                };

                for (var i = 0; i < cells.length; i++) {
                    if (cells[i].firstChild.getAttribute('data-type') != 'id') {
                        cells[i].onclick = editHandler;
                    }
                }
            }
        }

    };

    req.open('POST', 'get_models', true);
    req = setAjaxHeaders(req)
    req.send("model_id=" + this.id);
};

var models = document.getElementsByClassName('model_item');
for (var i = 0; i < models.length; i++) {
    models[i].onclick = ajaxSender;
}