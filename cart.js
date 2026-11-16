(function () {
    "use strict";

    const storageKey = "dezas-accessories-cart-v1";
    const currency = new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0
    });

    function readCart() {
        const saved = localStorage.getItem(storageKey);
        if (saved === null) {
            return [];
        }

        const cart = JSON.parse(saved);
        if (!Array.isArray(cart) || cart.some(function (item) {
            return !item || typeof item.id !== "string" ||
                typeof item.name !== "string" ||
                typeof item.image !== "string" ||
                !Number.isSafeInteger(item.price) || item.price < 0 ||
                !Number.isSafeInteger(item.quantity) || item.quantity < 1;
        })) {
            throw new Error("The saved cart has invalid data. Please clear the cart and try again.");
        }
        return cart;
    }

    function writeCart(cart) {
        localStorage.setItem(storageKey, JSON.stringify(cart));
        updateCartCount(cart);
    }

    function updateCartCount(cart) {
        const count = cart.reduce(function (total, item) {
            return total + item.quantity;
        }, 0);
        document.querySelectorAll("[data-cart-count]").forEach(function (element) {
            element.textContent = String(count);
        });
    }

    function showMessage(message) {
        let target = document.getElementById("cart-message");
        if (!target) {
            target = document.createElement("p");
            target.className = "cart-status";
            target.setAttribute("role", "status");
            target.setAttribute("aria-live", "polite");
            const container = document.querySelector(".page-intro") ||
                document.querySelector(".site-header") ||
                document.body;
            container.appendChild(target);
        }
        target.textContent = message;
    }

    function getImageUrl(image) {
        return new URL(image, window.location.href).href;
    }

    function renderCart() {
        const itemsContainer = document.getElementById("cart-items");
        if (!itemsContainer) {
            return;
        }

        let cart;
        try {
            cart = readCart();
        } catch (error) {
            showMessage(error.message || "Unable to load your cart.");
            document.getElementById("checkout-form").hidden = true;
            return;
        }

        itemsContainer.replaceChildren();
        updateCartCount(cart);
        const isEmpty = cart.length === 0;
        document.getElementById("cart-empty").hidden = !isEmpty;
        document.getElementById("cart-content").hidden = isEmpty;

        let total = 0;
        cart.forEach(function (item) {
            total += item.price * item.quantity;
            const row = document.createElement("article");
            row.className = "cart-item";

            const image = document.createElement("img");
            image.src = getImageUrl(item.image);
            image.alt = item.name;

            const details = document.createElement("div");
            const name = document.createElement("h2");
            name.textContent = item.name;
            const price = document.createElement("p");
            price.textContent = currency.format(item.price);
            const quantityLabel = document.createElement("label");
            quantityLabel.className = "quantity-label";
            quantityLabel.textContent = "Quantity";
            const quantity = document.createElement("input");
            quantity.type = "number";
            quantity.min = "1";
            quantity.step = "1";
            quantity.value = String(item.quantity);
            quantity.setAttribute("aria-label", "Quantity of " + item.name);
            quantity.dataset.quantityId = item.id;
            quantityLabel.appendChild(quantity);
            details.append(name, price, quantityLabel);

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "remove-item";
            remove.textContent = "Remove";
            remove.dataset.removeId = item.id;
            remove.setAttribute("aria-label", "Remove " + item.name + " from cart");
            row.append(image, details, remove);
            itemsContainer.appendChild(row);
        });

        document.getElementById("cart-total").textContent = currency.format(total);
    }

    function addProduct(button) {
        const product = button.closest(".product");
        const name = product && product.querySelector("h3");
        const priceElement = product && product.querySelector(".price");
        const image = product && product.querySelector(".product-image");
        const price = priceElement && Number(priceElement.textContent.replace(/[^\d]/g, ""));

        if (!name || !image || !Number.isSafeInteger(price) || price < 0) {
            showMessage("This product could not be added. Please try again.");
            return;
        }

        const id = image.getAttribute("src");
        try {
            const cart = readCart();
            const existing = cart.find(function (item) {
                return item.id === id;
            });
            if (existing) {
                existing.quantity += 1;
            } else {
                cart.push({
                    id: id,
                    name: name.textContent.trim(),
                    price: price,
                    image: id,
                    quantity: 1
                });
            }
            writeCart(cart);
            showMessage(name.textContent.trim() + " added to your cart.");
        } catch (error) {
            showMessage(error.message || "Unable to save your cart. Please try again.");
        }
    }

    document.addEventListener("click", function (event) {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }

        const addButton = target.closest(".product button");
        if (addButton) {
            addProduct(addButton);
            return;
        }

        const removeButton = target.closest("[data-remove-id]");
        if (removeButton) {
            try {
                const cart = readCart().filter(function (item) {
                    return item.id !== removeButton.dataset.removeId;
                });
                writeCart(cart);
                renderCart();
            } catch (error) {
                showMessage(error.message || "Unable to update your cart.");
            }
        }
    });

    document.addEventListener("change", function (event) {
        const target = event.target;
        if (!(target instanceof HTMLInputElement) || !target.dataset.quantityId) {
            return;
        }

        const quantity = Number(target.value);
        if (!Number.isSafeInteger(quantity) || quantity < 1) {
            showMessage("Quantity must be a whole number greater than zero.");
            renderCart();
            return;
        }

        try {
            const cart = readCart();
            const item = cart.find(function (entry) {
                return entry.id === target.dataset.quantityId;
            });
            if (item) {
                item.quantity = quantity;
                writeCart(cart);
                renderCart();
            }
        } catch (error) {
            showMessage(error.message || "Unable to update your cart.");
        }
    });

    const clearButton = document.getElementById("clear-cart");
    if (clearButton) {
        clearButton.addEventListener("click", function () {
            try {
                writeCart([]);
                renderCart();
            } catch (error) {
                showMessage(error.message || "Unable to clear your cart.");
            }
        });
    }

    const copyAccountButton = document.getElementById("copy-account-number");
    if (copyAccountButton) {
        copyAccountButton.addEventListener("click", async function () {
            const accountNumber = document.getElementById("account-number").textContent.trim();
            const status = document.getElementById("copy-account-status");

            try {
                if (navigator.clipboard) {
                    try {
                        await navigator.clipboard.writeText(accountNumber);
                    } catch (error) {
                        copyWithFallback(accountNumber);
                    }
                } else {
                    copyWithFallback(accountNumber);
                }
                status.textContent = "Account number copied.";
            } catch (error) {
                status.textContent = error.message || "Unable to copy the account number.";
            }
        });
    }

    function copyWithFallback(text) {
        const input = document.createElement("textarea");
        input.value = text;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        let copied;
        try {
            input.select();
            copied = document.execCommand("copy");
        } finally {
            input.remove();
        }
        if (!copied) {
            throw new Error("Copy is unavailable. Please select the account number and copy it.");
        }
    }

    const checkoutForm = document.getElementById("checkout-form");
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", function (event) {
            event.preventDefault();
            if (!checkoutForm.reportValidity()) {
                return;
            }

            try {
                const cart = readCart();
                if (cart.length === 0) {
                    showMessage("Add an item before checking out.");
                    renderCart();
                    return;
                }

                const orderNumber = "DZ-" + Date.now().toString(36).toUpperCase();
                const total = cart.reduce(function (sum, item) {
                    return sum + item.price * item.quantity;
                }, 0);
                writeCart([]);
                checkoutForm.hidden = true;
                document.getElementById("cart-content").hidden = true;
                document.getElementById("cart-confirmation").textContent =
                    "Demo order " + orderNumber + " completed for " + currency.format(total) +
                    ". No payment was taken.";
                document.getElementById("cart-confirmation").hidden = false;
                document.getElementById("cart-empty").hidden = true;
            } catch (error) {
                showMessage(error.message || "Unable to complete the demo order.");
            }
        });
    }

    window.addEventListener("storage", function (event) {
        if (event.key === storageKey) {
            renderCart();
        }
    });

    try {
        updateCartCount(readCart());
    } catch (error) {
        showMessage(error.message || "Unable to load your cart.");
    }
    renderCart();
})();
