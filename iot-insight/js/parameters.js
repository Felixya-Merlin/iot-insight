/*
 * parameters.js
 *
 * Handles parameter configuration UI.
 */

document.addEventListener("DOMContentLoaded", () => {

    const modal =
        document.getElementById("parameterModal");

    const addButton =
        document.getElementById("addParameterButton");

    const closeButton =
        document.getElementById("closeParameterModal");

    const cancelButton =
        document.getElementById("cancelParameter");

    const form =
        document.getElementById("parameterForm");


    function openModal() {

        if (modal) {
            modal.classList.add("show");
        }

    }


    function closeModal() {

        if (modal) {
            modal.classList.remove("show");
        }

    }


    if (addButton) {

        addButton.addEventListener(
            "click",
            openModal
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeModal
        );

    }


    if (form) {

        form.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                alert(
                    "Parameter configuration UI is ready. Backend integration will be added later."
                );


                closeModal();

            }
        );

    }


    /*
     * Close modal when clicking outside it.
     */

    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeModal();

                }

            }
        );

    }

});