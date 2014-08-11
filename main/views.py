import datetime
from django.shortcuts import render
from django.db import models
from django_ajax.decorators import ajax
from django_ajax.encoder import serialize_to_json
from django.http import HttpResponse
from django.core.exceptions import ValidationError


def get_app_models(app):
    from django.db.models import get_app, get_models
    app = get_app(app)
    models = get_models(app)
    return models


def index(request):
    models = get_app_models('main')
    models_verbose = []
    for model in models:
        models_verbose.append({'verbose_name': model._meta.verbose_name,
                               'model_id': model._meta.model_name})
    return render(request,
                  'index.html',
                  {'models': models_verbose})


@ajax
def update_cell(request):
    row_id = request.POST.get('id', '')
    field = request.POST.get('field', '')
    model_id = request.POST.get('model', '')
    value = request.POST.get('value', '')

    models = get_app_models('main')
    model = next(
        model for model in models if model._meta.model_name == model_id)

    error_message = ''
    try:
        if int(row_id) == 0:
            row = model()
            setattr(row, field, value)
            row.save()
        else:
            record = model.objects.get(id=row_id)
            setattr(record, field, value)
            record.save()
    except (ValueError, ValidationError):
        error_message = 'Input error: value "{}" is not valid for field "{}" in entity "{}"'.format(
            value, field, model_id)
    return {'error': error_message}


@ajax
def get_models(request):
    models = get_app_models('main')
    model_id = request.POST.get('model_id', '')
    model = next(
        model for model in models if model._meta.model_name == model_id)

    rows = None
    rows = model.objects.all()
    table = []

    is_empty = False
    if not rows:
        default_row = model()
        default_row.save()
        is_empty = True
        rows = model.objects.all()
    
    for row in rows:
        new_row = {}
        for field_name, value in row.__dict__.iteritems():
            if field_name.startswith('_'):
                continue

            cell_type = ''
            field = model._meta.get_field_by_name(field_name)[0]
            verbose_name = field.verbose_name
            internal_type = field.get_internal_type()

            if internal_type == 'DateField':
                cell_type = 'date'
                value = str(value)
            elif internal_type == 'IntegerField':
                cell_type = 'int'
            elif internal_type == 'CharField':
                cell_type = 'text'
            elif internal_type == 'AutoField':
                cell_type = 'id'

            new_row.update({field_name: [value, cell_type, verbose_name]})
        table.append({'row': new_row, 'row_id': row.id})

    return {'models': serialize_to_json(table), 'model': model_id, 'is_empty': is_empty}
