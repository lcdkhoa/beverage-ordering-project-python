$(document).ready(function () {

  setupPasswordToggle("#passwordToggle", "#password");


  $("#loginForm").on("submit", function (e) {
    e.preventDefault();

    const $form = $(this);
    const $btn = $("#loginBtn");
    const $btnText = $btn.find(".btn-text");
    const $btnLoading = $btn.find(".btn-loading");
    const $message = $("#loginMessage");


    $message.hide().removeClass("success error").text("");


    $btn.prop("disabled", true);
    $btnText.hide();
    $btnLoading.show();


    const formData = {
      username_or_email: $("#username_or_email").val().trim(),
      password: $("#password").val(),
    };


    $.ajax({
      url: "/api/auth/login",
      method: "POST",
      data: formData,
      dataType: "json",
      success: function (response) {
        if (response.success) {
          showSnackBar('success', response.message || "Đăng nhập thành công!");
          setTimeout(function () {
            window.AppLoading ? window.AppLoading.go("/") : (window.location.href = "/");
          }, 1500);
        } else {
          showSnackBar('failed', response.message || "Đăng nhập thất bại. Vui lòng thử lại.");
          $btn.prop("disabled", false);
          $btnText.show();
          $btnLoading.hide();
        }
      },
      error: function (xhr, status, error) {
        console.error("Login error:", error);
        showSnackBar('failed', "Có lỗi xảy ra. Vui lòng thử lại sau.");
        $btn.prop("disabled", false);
        $btnText.show();
        $btnLoading.hide();
      },
    });
  });


  $("#facebookLogin").on("click", function () {
    showSnackBar('information', "Tính năng đăng nhập bằng Facebook sẽ được triển khai sau.");
  });

  $("#googleLogin").on("click", function () {
    showSnackBar('information', "Tính năng đăng nhập bằng Google sẽ được triển khai sau.");
  });
});
