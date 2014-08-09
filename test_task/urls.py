from django.conf.urls import patterns, include, url
from main.views import index, get_models, update_cell
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
	
    url(r'^$', index, name='index'),

    url(r'^get_models$', get_models, name='get_models'),
    url(r'^update_cell$', update_cell, name='update_cell'),

    url(r'^admin/', include(admin.site.urls)),
)
