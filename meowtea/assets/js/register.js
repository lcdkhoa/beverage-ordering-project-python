let otpTimer = null;
let otpCountdown = 60;
let registrationData = null;

$(document).ready(function () {

  setupPasswordToggle("#passwordToggle", "#password");


  $("#registerForm").on("submit", function (e) {
    e.preventDefault();

    const $form = $(this);
    const $btn = $("#registerBtn");
    const $btnText = $btn.find(".btn-text");
    const $btnLoading = $btn.find(".btn-loading");
    const $message = $("#registerMessage");


    $message.hide().removeClass("success error").text("");


    $btn.prop("disabled", true);
    $btnText.hide();
    $btnLoading.show();


    const formData = {
      username: $("#username").val().trim(),
      password: $("#password").val(),
      ho: $("#ho").val().trim(),
      ten: $("#ten").val().trim(),
      dien_thoai: $("#dien_thoai").val().trim() || null,
      email: $("#email").val().trim() || null,
    };


    registrationData = formData;


    if (!formData.username || !formData.password || !formData.ho || !formData.ten) {
      showSnackBar("failed", "Vui lòng điền đầy đủ thông tin bắt buộc.");
      $btn.prop("disabled", false);
      $btnText.show();
      $btnLoading.hide();
      return;
    }


    showOTPScreen(formData.email || "abc***@gmail.com");
    

    $btn.prop("disabled", false);
    $btnText.show();
    $btnLoading.hide();
  });


  setupOTPInputs();


  $("#otpForm").on("submit", function (e) {
    e.preventDefault();
    verifyOTP();
  });


  $("#backToLoginBtn").on("click", function () {
    window.location.href = "/login";
  });
});

function showOTPScreen(email) {

  $("#registerFormWrapper").hide();
  

  $("#otpVerifyWrapper").show();
  

  $("#userEmail").text(email);
  

  startOTPTimer();
  

  $(".otp-input").first().focus();
}

function setupOTPInputs() {
  const $otpInputs = $(".otp-input");

  $otpInputs.on("input", function () {
    const $this = $(this);
    const value = $this.val();
    

    if (!/^\d*$/.test(value)) {
      $this.val("");
      return;
    }


    $this.removeClass("error");


    if (value.length === 1) {
      const index = parseInt($this.data("index"));
      if (index < 5) {
        $otpInputs.eq(index + 1).focus();
      }
    }
  });

  $otpInputs.on("keydown", function (e) {
    const $this = $(this);
    const index = parseInt($this.data("index"));


    if (e.key === "Backspace") {
      if ($this.val() === "" && index > 0) {
        $otpInputs.eq(index - 1).focus();
      }
    }
  });


  $otpInputs.first().on("paste", function (e) {
    e.preventDefault();
    const pastedData = e.originalEvent.clipboardData.getData("text");
    const digits = pastedData.replace(/\D/g, "").slice(0, 6);
    
    digits.split("").forEach((digit, index) => {
      $otpInputs.eq(index).val(digit);
    });
    
    if (digits.length === 6) {
      $otpInputs.last().focus();
    }
  });
}

function startOTPTimer() {
  otpCountdown = 60;
  updateTimerDisplay();

  otpTimer = setInterval(function () {
    otpCountdown--;
    updateTimerDisplay();

    if (otpCountdown <= 0) {
      clearInterval(otpTimer);
      showResendLink();
    }
  }, 1000);
}

function updateTimerDisplay() {
  $("#otpTimer").text(otpCountdown);
}

function showResendLink() {
  $(".otp-resend-wrapper").html(
    '<a href="#" class="otp-resend-link" id="resendOTPLink">Gửi lại mã</a>'
  );

  $("#resendOTPLink").on("click", function (e) {
    e.preventDefault();
    resendOTP();
  });
}

function resendOTP() {

  $(".otp-input").val("").removeClass("error");
  

  $("#otpMessage").hide().removeClass("success error").text("");
  

  $(".otp-resend-wrapper").html(
    '<span class="otp-resend-text">Gửi lại mã sau: <span id="otpTimer">60</span>s</span>'
  );
  startOTPTimer();
  

  $(".otp-input").first().focus();
}

function verifyOTP() {
  const $btn = $("#otpVerifyBtn");
  const $btnText = $btn.find(".btn-text");
  const $btnLoading = $btn.find(".btn-loading");
  const $message = $("#otpMessage");
  const $otpInputs = $(".otp-input");


  let otpValue = "";
  $otpInputs.each(function () {
    otpValue += $(this).val();
  });


  $message.hide().removeClass("success error").text("");


  if (otpValue.length !== 6) {
    showSnackBar("failed", "Vui lòng nhập đầy đủ 6 chữ số.");
    $otpInputs.addClass("error");
    return;
  }


  $btn.prop("disabled", true);
  $btnText.hide();
  $btnLoading.show();


  if (otpValue === "123456") {

    registerUser();
  } else {

    showSnackBar("failed", "Mã xác minh không chính xác. Vui lòng thử lại.");
    $otpInputs.addClass("error").val("");
    $otpInputs.first().focus();

    $btn.prop("disabled", false);
    $btnText.show();
    $btnLoading.hide();
  }
}

function registerUser() {
  const $btn = $("#otpVerifyBtn");
  const $btnText = $btn.find(".btn-text");
  const $btnLoading = $btn.find(".btn-loading");
  const $message = $("#otpMessage");


  $.ajax({
    url: "/api/auth/register",
    method: "POST",
    data: registrationData,
    dataType: "json",
    success: function (response) {
      if (response.success) {

        if (otpTimer) {
          clearInterval(otpTimer);
        }


        showSuccessScreen();
      } else {
        var msg = response.message || "Đăng ký thất bại. Vui lòng thử lại.";
        var type = (msg.indexOf("Không tìm thấy role") !== -1) ? "warm" : "failed";
        showSnackBar(type, msg);
        $btn.prop("disabled", false);
        $btnText.show();
        $btnLoading.hide();
      }
    },
    error: function (xhr, status, error) {
      console.error("Register error:", error);
      let errorMessage = "Có lỗi xảy ra. Vui lòng thử lại sau.";
      if (xhr.responseText) {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          if (errorResponse.message) {
            errorMessage = errorResponse.message;
          }
        } catch (e) {}
      }
      showSnackBar("failed", errorMessage);
      $btn.prop("disabled", false);
      $btnText.show();
      $btnLoading.hide();
    },
  });
}

function showSuccessScreen() {

  $("#otpVerifyWrapper").hide();
  

  $("#successWrapper").show();
}
