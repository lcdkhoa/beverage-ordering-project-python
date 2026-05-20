function getApiPath(endpoint, basePath = "api/") {
  const [pathPart, queryPart] = String(endpoint || "").split("?");
  const cleanEndpoint = pathPart.replace(/\.php$/, "");
  let apiPath = "/" + basePath.replace(/^\/+|\/+$/g, "") + "/" + cleanEndpoint.replace(/^\/+/, "");

  if (queryPart !== undefined) {
    apiPath += "?" + queryPart;
  }

  return apiPath;
}

function getApiBasePath() {
  return getApiPath("", "api/management/");
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN").format(amount) + "₫";
}

function formatCurrencyWithStyle(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount);
}

function escapeHtml(text) {
  if (!text) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

function updateCartCount() {
  $.ajax({
    url: getApiPath("cart/count"),
    method: "GET",
    dataType: "json",
    success: function (response) {
      if (response.success) {
        $(".cart-count").text(response.count || 0);
      }
    },
    error: function () {

    },
  });
}

function showAlert(
  message,
  type,
  containerSelector = ".management-content",
  autoHideDelay = 5000
) {

  $(".alert").remove();

  const alertClass = type === "success" ? "alert-success" : "alert-error";
  const $alert = $(
    '<div class="alert ' + alertClass + '">' + escapeHtml(message) + "</div>"
  );


  const $container = $(containerSelector);
  if ($container.length > 0) {
    $container.prepend($alert);
  } else {

    $("body").prepend($alert);
  }


  if (autoHideDelay > 0) {
    setTimeout(function () {
      $alert.fadeOut(function () {
        $(this).remove();
      });
    }, autoHideDelay);
  }
}

function setupPasswordToggle(toggleId, inputId) {
  $(toggleId).on("click", function () {
    const passwordInput = $(inputId);
    const hiddenIcon = $(this).find(".eye-icon-hidden");
    const visibleIcon = $(this).find(".eye-icon-visible");

    if (passwordInput.attr("type") === "password") {
      passwordInput.attr("type", "text");
      hiddenIcon.hide();
      visibleIcon.show();
    } else {
      passwordInput.attr("type", "password");
      hiddenIcon.show();
      visibleIcon.hide();
    }
  });
}

function handleFormSubmission(options) {
  const {
    formSelector,
    buttonSelector,
    messageSelector,
    apiUrl,
    onSuccess,
    onError,
    getFormData,
  } = options;

  $(formSelector).on("submit", function (e) {
    e.preventDefault();

    const $form = $(this);
    const $btn = $(buttonSelector);
    const $btnText = $btn.find(".btn-text");
    const $btnLoading = $btn.find(".btn-loading");
    const $message = $(messageSelector);


    $message.hide().removeClass("success error").text("");


    $btn.prop("disabled", true);
    $btnText.hide();
    $btnLoading.show();


    const formData = getFormData ? getFormData($form) : $form.serialize();


    $.ajax({
      url: apiUrl,
      method: "POST",
      data: formData,
      dataType: "json",
      success: function (response) {
        if (response.success) {
          if (onSuccess) {
            onSuccess(response, $form, $btn, $btnText, $btnLoading, $message);
          } else {
            $message
              .addClass("success")
              .text(response.message || "Thành công!")
              .show();
            $btn.prop("disabled", false);
            $btnText.show();
            $btnLoading.hide();
          }
        } else {
          if (onError) {
            onError(response, $form, $btn, $btnText, $btnLoading, $message);
          } else {
            $message
              .addClass("error")
              .text(response.message || "Có lỗi xảy ra. Vui lòng thử lại.")
              .show();
            $btn.prop("disabled", false);
            $btnText.show();
            $btnLoading.hide();
          }
        }
      },
      error: function (xhr, status, error) {
        console.error("Form submission error:", error);
        let errorMessage = "Có lỗi xảy ra. Vui lòng thử lại sau.";


        if (xhr.responseText) {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse.message) {
              errorMessage = errorResponse.message;
            }
          } catch (e) {

          }
        }

        if (onError) {
          onError(
            { success: false, message: errorMessage },
            $form,
            $btn,
            $btnText,
            $btnLoading,
            $message
          );
        } else {
          $message.addClass("error").text(errorMessage).show();
          $btn.prop("disabled", false);
          $btnText.show();
          $btnLoading.hide();
        }
      },
    });
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function handleResize(callback, delay = 250) {
  let resizeTimeout;
  return function () {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(callback, delay);
  };
}
