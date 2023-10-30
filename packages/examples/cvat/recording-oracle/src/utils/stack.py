import inspect


def current_function_name(depth=1):
    return inspect.getouterframes(inspect.currentframe())[depth].function
