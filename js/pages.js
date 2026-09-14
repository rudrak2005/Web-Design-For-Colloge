/* =====================================
   LOADING
===================================== */

const pageLoader =
    document.getElementById(
        "pageLoader"
    );


function showPageLoader(message) {

    if (!pageLoader) {
        return;
    }


    const loaderText =
        pageLoader.querySelector(
           ("[data-loader-text]")
        );


    if (loaderText) {

        loaderText.textContent =
            message || "Loading page...";

    }


    pageLoader.classList.remove(
        "hidden"
    );

}


function hidePageLoader() {

    if (!pageLoader) {
        return;
    }

    pageLoader.classList.add(
        "hidden"
    );

}


/* Initial loading */

setTimeout(
    hidePageLoader,
    500
);

