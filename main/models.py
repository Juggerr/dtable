import yaml
from django.db import models
from django.contrib import admin


def create_model(name, fields=None, app_label='', module='', options=None, admin_opts=None):
    """
    Create specified model
    """
    class Meta:
        # Using type('Meta', ...) gives a dictproxy error during model creation
        pass

    if app_label:
        # app_label must be set using the Meta inner class
        setattr(Meta, 'app_label', app_label)

    # Update Meta with any options that were provided
    if options is not None:
        for key, value in options.items():
            setattr(Meta, key, value)

    # Set up a dictionary to simulate declarations within a class
    attrs = {'__module__': module, 'Meta': Meta}

    # Add in any fields that were provided
    if fields:
        attrs.update(fields)

    # Create the class, which automatically triggers ModelBase processing
    model = type(name, (models.Model,), attrs)

    # Create an Admin class if admin options were provided
    if admin_opts is not None:
        class Admin(admin.ModelAdmin):
            pass
        for key, value in admin_opts:
            setattr(Admin, key, value)
        admin.site.register(model, Admin)

    return model


def install(model):
    from django.core.management import sql, color
    from django.db import connection

    style = color.no_style()

    cursor = connection.cursor()
    statements = sql.custom_sql_for_model(model, style, connection)
    for sql in statements:
        cursor.execute(sql)


def get_filed_by_alias(filed_alias, field_title):

    FIELD_TYPE_MAP = {
		'int': models.IntegerField(verbose_name=field_title, null=True),
		'char': models.CharField(verbose_name=field_title, max_length=255, null=True),
		'date': models.DateField(verbose_name=field_title, null=True)
    }

    return FIELD_TYPE_MAP[filed_alias]


db_schema = open('db_schema.yaml', 'r')
yaml_models = yaml.load(db_schema)
for model_name, model_props in yaml_models.items():
    fields = {}
    for field in model_props['fields']:
        fields.update({field['id']: get_filed_by_alias(field['type'], field['title'])})

    options = {
        'verbose_name': model_props['title'],
    }

    model = create_model(model_name, fields,
        module=__name__,
        options=options,
        admin_opts={},
        app_label='main',
    )

    install(model)