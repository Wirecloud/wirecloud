from django.db.transaction import is_dirty, leave_transaction_management, rollback, commit, enter_transaction_management, managed
from django.db import DEFAULT_DB_ALIAS
from django.http import HttpResponse


def commit_on_http_success(func, using=None):
    """
    This decorator activates db commit on HTTP success response. This way, if the
    view function return a success reponse, a commit is made; if the viewfunc
    produces an exception or return an error response, a rollback is made.
    """
    if using is None:
        using = DEFAULT_DB_ALIAS

    def wrapped_func(*args, **kwargs):
        enter_transaction_management(using=using)
        managed(True, using=using)

        try:
            res = func(*args, **kwargs)
        except:
            if is_dirty(using=using):
                rollback(using=using)
            raise
        else:
            if is_dirty(using=using):

                if not isinstance(res, HttpResponse) or res.status_code > 200 or res.status_code < 200:
                    rollback(using=using)
                else:
                    try:
                        commit(using=using)
                    except:
                        rollback(using=using)
                        raise

        leave_transaction_management(using=using)
        return res

    return wrapped_func
