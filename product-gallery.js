(function () {
    "use strict";

    const productImages = document.querySelectorAll(".product-image");
    if (productImages.length === 0) {
        return;
    }

    const viewer = document.createElement("dialog");
    viewer.className = "product-image-viewer";
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = "Close";
    closeButton.setAttribute("aria-label", "Close product image");
    const expandedImage = document.createElement("img");
    viewer.append(closeButton, expandedImage);
    document.body.appendChild(viewer);

    function showImage(image) {
        expandedImage.src = image.currentSrc || image.src;
        expandedImage.alt = image.alt;
        viewer.setAttribute("aria-label", image.alt ?
            "Product image: " + image.alt : "Product image");

        if (typeof viewer.showModal === "function") {
            viewer.showModal();
        } else {
            viewer.setAttribute("open", "");
        }
    }

    productImages.forEach(function (image) {
        image.tabIndex = 0;
        image.setAttribute("role", "button");
        image.setAttribute("aria-haspopup", "dialog");
        image.setAttribute("aria-label", "View larger image: " + image.alt);
        image.title = "View larger image";
        image.addEventListener("click", function () {
            showImage(image);
        });
        image.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                showImage(image);
            }
        });
    });

    closeButton.addEventListener("click", function () {
        if (typeof viewer.close === "function") {
            viewer.close();
        } else {
            viewer.removeAttribute("open");
        }
    });

    viewer.addEventListener("click", function (event) {
        if (event.target === viewer && typeof viewer.close === "function") {
            viewer.close();
        }
    });
})();
