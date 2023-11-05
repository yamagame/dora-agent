import sys
from pyPS4Controller.controller import Controller


class MyController(Controller):

    def __init__(self, **kwargs):
        Controller.__init__(self, **kwargs)

    def on_x_press(self):
        sys.stdout.write("on_x_press")
        sys.stdout.flush()

    def on_x_release(self):
        sys.stdout.write("on_x_prelease")
        sys.stdout.flush()

    # def x_pressed(self):
    #    print("x_pressed", flush=True)
    #    return self.button_id == 0 and self.button_type == 1 and self.value == 1

    # def x_released(self):
    #    print("x_released", flush=True)
    #    return self.button_id == 0 and self.button_type == 1 and self.value == 0


controller = MyController(interface="/dev/input/js0",
                          connecting_using_ds4drv=False)
controller.listen()
