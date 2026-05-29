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

(function () {
  let activeCount = 0;
  let progress = 0.42;
  let progressTimer = null;
  let hideTimer = null;

  function getLoader() {
    return $("#app-top-loader");
  }

  function setProgress(value) {
    progress = Math.max(0.08, Math.min(value, 1));
    getLoader().css("--app-loader-progress", progress);
  }

  function clearProgressTimer() {
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  function begin() {
    const $loader = getLoader();
    if (!$loader.length) return;

    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }

    $("body").addClass("app-is-navigating");
    $loader.removeClass("finishing").addClass("active");
    setProgress(Math.max(progress, 0.18));
    clearProgressTimer();
    progressTimer = setInterval(function () {
      const next = progress + (0.88 - progress) * 0.18;
      setProgress(next);
    }, 260);
  }

  function finish(force) {
    if (force) {
      activeCount = 0;
    } else if (activeCount > 0) {
      activeCount -= 1;
    }

    if (activeCount > 0) return;

    clearProgressTimer();
    const $loader = getLoader();
    if (!$loader.length) return;

    $loader.addClass("finishing").removeClass("is-booting");
    setProgress(1);
    hideTimer = setTimeout(function () {
      $loader.removeClass("active finishing");
      $("body").removeClass("app-is-navigating");
      setProgress(0.08);
      hideTimer = null;
    }, 260);
  }

  function start() {
    activeCount += 1;
    begin();

    let closed = false;
    return function () {
      if (closed) return;
      closed = true;
      finish(false);
    };
  }

  function inlineMarkup(message, modifierClass) {
    const classes = ["app-inline-loader"];
    if (modifierClass) {
      classes.push(modifierClass);
    }

    return (
      '<div class="' +
      classes.join(" ") +
      '" role="status" aria-live="polite">' +
      '<span class="app-inline-loader-mark" aria-hidden="true"></span>' +
      '<span class="app-inline-loader-text">' +
      escapeHtml(message || "Đang tải...") +
      "</span>" +
      "</div>"
    );
  }

  function renderInline(target, message, modifierClass) {
    $(target).html(inlineMarkup(message, modifierClass));
  }

  function go(url) {
    start();
    window.location.href = url;
  }

  function reload() {
    start();
    window.location.reload();
  }

  function shouldShowForLink(anchor, event) {
    const href = anchor.getAttribute("href");
    if (!href || href === "#" || href.indexOf("javascript:") === 0) return false;
    if (href.charAt(0) === "#") return false;
    if (anchor.target && anchor.target !== "_self") return false;
    if (anchor.hasAttribute("download")) return false;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.which === 2) return false;
    if ($(anchor).is(".back-to-top-link, .category-link, .pagination a, .order-card-detail-link, .add-to-cart-btn, .terms-link, .forgot-password-link, .social-icon, .profile-nav-item[data-tab]")) return false;

    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return false;

    return true;
  }

  window.AppLoading = {
    start,
    done: function () {
      finish(false);
    },
    finishAll: function () {
      finish(true);
    },
    inlineMarkup,
    renderInline,
    go,
    reload,
  };

  $(function () {
    $(document).on("click", "a[href]", function (event) {
      if (event.isDefaultPrevented() || !shouldShowForLink(this, event)) return;
      start();
    });

    $(document).on("submit", "form", function (event) {
      const method = String($(this).attr("method") || "get").toLowerCase();
      if (event.isDefaultPrevented() || method !== "get" || $(this).data("noLoader")) return;
      start();
    });

    setTimeout(function () {
      finish(true);
    }, 160);
  });

  $(window).on("load pageshow", function () {
    finish(true);
  });

  $(window).on("beforeunload pagehide", function () {
    start();
  });
})();
