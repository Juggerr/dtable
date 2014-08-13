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
                var modelId = response.content.model;
                var htmlTable = document.createElement('table');
                htmlTable.setAttribute('id', 'table_table');
                htmlTable.setAttribute('data-model', modelId);
                htmlTable.setAttribute('border', 1);

                var addLastRow = false;
                if (response.content.is_empty) {
                    addLastRow = false;
                } else {
                    addLastRow = true;
                }

                var addingRow;
                for (var tRow in table) {
                    var hRow = document.createElement('tr');
                    htmlTable.appendChild(hRow);
                    addingRow = document.createElement('tr');
                    addingRow.setAttribute('style', "height: 20px;");
                    addingRow.setAttribute('data-row-id', 0);
                    var row = document.createElement('tr');
                    row.setAttribute('data-row-id', table[tRow].row_id);
                    for (var tCell in table[tRow].row) {
                        var cell = document.createElement('td');
                        var lCell = document.createElement('td');
                        cell.setAttribute('class', 'cell');
                        lCell.setAttribute('class', 'cell');
                        var innerDiv = document.createElement('div');
                        innerDiv.setAttribute('data-field', tCell);
                        innerDiv.setAttribute('data-type', table[tRow].row[tCell][1]);
                        lCell.appendChild(innerDiv.cloneNode(false));
                        innerDiv.innerHTML = table[tRow].row[tCell][0];
                        var hCell = document.createElement('td');
                        hCell.innerHTML = table[tRow].row[tCell][2];
                        hRow.appendChild(hCell);
                        cell.appendChild(innerDiv);
                        if (table[tRow].row[tCell][1] == 'id') {
                            hRow.insertBefore(hCell, hRow.firstChild);
                            row.insertBefore(cell, row.firstChild);
                            addingRow.insertBefore(lCell, addingRow.firstChild);
                        } else {
                            hRow.appendChild(hCell);
                            row.appendChild(cell);
                            addingRow.appendChild(lCell);
                        }

                    }
                    htmlTable.replaceChild(hRow, htmlTable.firstChild);
                    htmlTable.appendChild(row);
                }
                if (addLastRow) {
                    htmlTable.appendChild(addingRow);
                }
                var tableContainer = document.getElementById('table');
                if (document.getElementById('table_table')) {
                    tableContainer.replaceChild(htmlTable, document.getElementById('table_table'));
                } else {
                    tableContainer.appendChild(htmlTable);
                }

                var cells = document.getElementsByClassName('cell');

                var editHandler = function() {
                    if (this.tagName != 'input') {
                        var inputField = document.createElement('input');
                        var cellType = this.firstChild.getAttribute('data-type');
                        var dataField = this.firstChild.getAttribute('data-field');
                        if (cellType == 'text') {
                            inputField.type = 'text';
                        } else if (cellType == 'int') {
                            inputField.type = 'number';
                        } else if (cellType == 'date') {
                            inputField.type = 'text';
                            inputField.id = 'date';
                        }
                        inputField.setAttribute('data-type', cellType);
                        inputField.setAttribute('data-field', dataField);
                        inputField.setAttribute('value', this.firstChild.innerHTML);
                        this.replaceChild(inputField, this.firstChild);

                        this.firstChild.focus();
                        this.onclick = null;
                        calendar.set("date");
                        this.firstChild.click(true);

                        var replaceDivToInput = function() {
                            var newDiv = document.createElement('div');
                            var input;
                            if (document.getElementById('date')) {
                                input = document.getElementById('date');
                            } else {
                                input = this;
                            }

                            var value = input.value;
                            newDiv.innerHTML = value;
                            var dataType = input.getAttribute('data-type');
                            newDiv.setAttribute('data-type', dataType);

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
                                        var errorBox = document.getElementById('error-box');
                                        if (error) {
                                            var erroredCell = document.getElementById('changed');
                                            erroredCell.setAttribute('style', 'background-color: red; height: 20px');
                                            errorBox.innerHTML = error;
                                        } else {
                                            errorBox.innerHTML = '';
                                            var modelItem = document.getElementById(model);
                                            modelItem.click();
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


                        if (cellType == 'text' || cellType == 'int') {
                            this.firstChild.onblur = replaceDivToInput;
                        } else if (cellType == 'date') {
                            this.firstChild.onchange = replaceDivToInput;
                        }

                        calendar.onhide = replaceDivToInput;
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