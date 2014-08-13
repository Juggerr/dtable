# -*- coding: utf-8 -*-
from django.test import TestCase
from django.test.client import Client
from django.test.utils import override_settings
from django.core import management
from test_task import settings
from django.db import transaction
import os
import json

db_schema = """
users:
    title: Пользователи
    fields:
        - {id: name, title: Имя, type: char}
        - {id: paycheck, title: Зарплата, type: int}
        - {id: date_joined, title: Дата поступления на работу, type: date}

rooms:
    title: Комнаты
    fields:
        - {id: department, title: Отдел, type: char}
        - {id: spots, title: Вместимость, type: int}

staff:
    title: Персонал
    fields:
        - {id: name, title: Фамилия, type: char}
        - {id: name, title: Имя, type: char}
        - {id: department, title: Отдел, type: char}
"""

with open("test_db.yaml", "w") as yaml_file:
    yaml_file.write(db_schema)

@override_settings(YAML_DB_SCHEMA="test_db.yaml")
class TableTest(TestCase):

    def setUp(self):
        self.client = Client()

        self.client.post(
            '/update_cell', {'id': 0, 'model': 'users', 'field': 'name', 'value': 'John'}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.client.post(
            '/update_cell', {'id': 1, 'model': 'users', 'field': 'paycheck', 'value': 10}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.client.post(
            '/update_cell', {'id': 1, 'model': 'users', 'field': 'date_joined', 'value': '2014-01-01'}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')

        self.client.post(
            '/update_cell', {'id': 0, 'model': 'users', 'field': 'name', 'value': 'John'}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.client.post(
            '/update_cell', {'id': 2, 'model': 'users', 'field': 'paycheck', 'value': 10}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.client.post(
            '/update_cell', {'id': 2, 'model': 'users', 'field': 'date_joined', 'value': '2014-01-01'}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')

        self.client.post(
            '/update_cell', {'id': 0, 'model': 'users', 'field': 'name', 'value': 'Anna'}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.client.post(
            '/update_cell', {'id': 3, 'model': 'users', 'field': 'paycheck', 'value': 20}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.client.post(
            '/update_cell', {'id': 3, 'model': 'users', 'field': 'date_joined', 'value': '2014-02-02'}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')

        self.client.post(
            '/update_cell', {'id': 0, 'model': 'users', 'field': 'name', 'value': 'Anna'}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.client.post(
            '/update_cell', {'id': 4, 'model': 'users', 'field': 'paycheck', 'value': 30}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.client.post(
            '/update_cell', {'id': 4, 'model': 'users', 'field': 'date_joined', 'value': '2014-03-03'}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')

    @classmethod
    def tearDownClass(cls):
    	os.remove("test_db.yaml")

    def test_get_models_list(self):
        resp = self.client.get('/')
        self.assertEqual(len(resp.context['models']), 3)
        self.assertTrue(set(['users', 'rooms', 'staff']) & {
                        m['model_id'] for m in resp.context['models']})

    def test_get_model(self):
        resp = self.client.post(
            '/get_models', {'model_id': 'users'}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        resp = json.loads(resp.content)
        rows = json.loads(resp['content']['models'])
        self.assertEqual(len(rows), 4)

    def test_update_rows(self):
        new_val_name = 'New1Name'
        resp = self.client.post(
            '/update_cell', {'id': 1, 'model': 'users', 'field': 'name', 'value': new_val_name}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        new_val_paycheck = 100
        resp = self.client.post(
            '/update_cell', {'id': 2, 'model': 'users', 'field': 'paycheck', 'value': new_val_paycheck}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        new_val_date_joined = '2020-05-05'
        resp = self.client.post(
            '/update_cell', {'id': 3, 'model': 'users', 'field': 'date_joined', 'value': new_val_date_joined}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')

        resp = self.client.post(
            '/get_models', {'model_id': 'users'}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')

        resp = json.loads(resp.content)
        model = json.loads(resp['content']['models'])

        self.assertEqual(
            json.loads(resp['content']['models'])[0]['row']['name'][0], new_val_name)
        self.assertEqual(json.loads(resp['content']['models'])[
                         1]['row']['paycheck'][0], new_val_paycheck)
        self.assertEqual(json.loads(resp['content']['models'])[
                         2]['row']['date_joined'][0], new_val_date_joined)

    def test_validation_cells(self):
        invalid_value_for_paycheck = 'Hundred'
        with transaction.atomic():
            resp = self.client.post(
                '/update_cell', {'id': 2, 'model': 'users', 'field': 'paycheck', 'value': invalid_value_for_paycheck}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        resp = json.loads(resp.content)
        self.assertTrue(
            'Hundred' in resp['content']['error'].replace('"', '').split())

        invalid_value_for_date_joined = 'March'
        with transaction.atomic():
            resp = self.client.post(
                '/update_cell', {'id': 2, 'model': 'users', 'field': 'date_joined', 'value': invalid_value_for_date_joined}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        resp = json.loads(resp.content)
        self.assertTrue(
            'March' in resp['content']['error'].replace('"', '').split())

