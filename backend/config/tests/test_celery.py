from config.celery import app


def test_celery_app_loads():
    assert app.main == "eratex"
    assert app.conf.broker_url

