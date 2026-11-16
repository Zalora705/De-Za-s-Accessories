(function () {
    "use strict";

    const buttons = document.querySelectorAll(".menu-toggle");

    function setMenuOpen(button, isOpen) {
        const menu = document.getElementById(button.getAttribute("aria-controls"));
        if (!menu) {
            return;
        }

        button.setAttribute("aria-expanded", String(isOpen));
        button.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
        menu.hidden = !isOpen;
    }

    buttons.forEach(function (button) {
        button.addEventListener("click", function () {
            setMenuOpen(button, button.getAttribute("aria-expanded") !== "true");
        });
    });

    document.addEventListener("click", function (event) {
        if (!(event.target instanceof Element) || event.target.closest(".site-menu-wrap")) {
            return;
        }

        buttons.forEach(function (button) {
            setMenuOpen(button, false);
        });
    });

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") {
            return;
        }

        buttons.forEach(function (button) {
            if (button.getAttribute("aria-expanded") === "true") {
                setMenuOpen(button, false);
                button.focus();
            }
        });
    });
})();
