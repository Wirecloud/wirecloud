/*
 *     Copyright (c) 2008-2014 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of Wirecloud Platform.
 *
 *     Wirecloud Platform is free software: you can redistribute it and/or
 *     modify it under the terms of the GNU Affero General Public License as
 *     published by the Free Software Foundation, either version 3 of the
 *     License, or (at your option) any later version.
 *
 *     Wirecloud is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with Wirecloud Platform.  If not, see
 *     <http://www.gnu.org/licenses/>.
 *
 */

/* global StyledElements */

(function () {

    "use strict";

    /**
     * @experimental
     *
     * Permite ejecutar secuencialmente distintos comandos. Dado que javascript no
     * tiene un interfaz para manejo de hilos, esto realmente sólo es necesario en
     * los casos en los que la concurrencia provenga a través de alguno de los
     * mecanismos de señales soportados por javascript (de momento, estos son los
     * eventos, los temporizadores y las peticiones asíncronas mediante el objeto
     * XMLHttpRequest).
     */
    var CommandQueue = function CommandQueue(context, initFunc, stepFunc) {
        var running = false;
        var elements = [];
        var step = 0;
        var stepTimes = null;

        function doStep() {
            if (stepFunc(step, context)) {
                var timeDiff = stepTimes[step] - (new Date()).getTime();
                if (timeDiff < 0) {
                    timeDiff = 0;
                }

                step++;
                setTimeout(doStep, timeDiff);
            } else {
                doInit();
            }
        }

        function doInit() {
            var command;
            do {
                command = elements.shift();
            } while (command !== undefined && !(stepTimes = initFunc(context, command)));

            if (command !== undefined) {
                step = 0;
                var timeDiff = stepTimes[step] - (new Date()).getTime();
                if (timeDiff < 0) {
                    timeDiff = 0;
                }
                setTimeout(doStep, timeDiff);
            } else {
                running = false;
            }
        }

        /**
         * Añade un comando a la cola de procesamiento. El comando será procesado
         * despues de que se procesen todos los comandos añadidos anteriormente.
         *
         * @param command comando a añadir a la cola de procesamiento. El tipo de
         * este párametro tiene que ser compatible con las funciones initFunc y
         * stepFunc pasadas en el constructor.
         */
        this.addCommand = function addCommand(command) {
            if (command === undefined) {
                return;
            }

            elements.push(command);

            if (!running) {
                running = true;
                doInit();
            }
        };
    };

    StyledElements.CommandQueue = CommandQueue;

})();
