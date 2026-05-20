from .clock import local_now
from .extensions import db
from .utils import decimal_to_number


class DictMixin:
    def to_dict(self):
        data = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if hasattr(value, "strftime"):
                value = value.strftime("%Y-%m-%d %H:%M:%S")
            else:
                value = decimal_to_number(value)
            data[column.name] = value
        return data


class Role(db.Model, DictMixin):
    __tablename__ = "Role"

    MaRole = db.Column(db.Integer, primary_key=True)
    TenRole = db.Column(db.String(50), nullable=False)


class User(db.Model, DictMixin):
    __tablename__ = "User"

    MaUser = db.Column(db.Integer, primary_key=True)
    Username = db.Column(db.String(100), nullable=False, unique=True)
    Password = db.Column(db.String(255), nullable=False)
    Ho = db.Column(db.String(50), nullable=False)
    Ten = db.Column(db.String(50), nullable=False)
    GioiTinh = db.Column(db.String(1), nullable=True)
    DienThoai = db.Column(db.String(20))
    Email = db.Column(db.String(100))
    TrangThai = db.Column(db.Integer, default=1)
    MaRole = db.Column(db.Integer, db.ForeignKey("Role.MaRole"), nullable=False)
    DiaChi = db.Column(db.Text, nullable=True)

    role = db.relationship("Role")


class Store(db.Model, DictMixin):
    __tablename__ = "Store"

    MaStore = db.Column(db.Integer, primary_key=True)
    TenStore = db.Column(db.String(200), nullable=False)
    DiaChi = db.Column(db.Text, nullable=False)
    DienThoai = db.Column(db.String(20))
    TrangThai = db.Column(db.Integer, default=1)


class UserStore(db.Model, DictMixin):
    __tablename__ = "User_Store"

    MaUser = db.Column(db.Integer, db.ForeignKey("User.MaUser"), primary_key=True)
    MaStore = db.Column(db.Integer, db.ForeignKey("Store.MaStore"), primary_key=True)


class Category(db.Model, DictMixin):
    __tablename__ = "Category"

    MaCategory = db.Column(db.Integer, primary_key=True)
    TenCategory = db.Column(db.String(100), nullable=False)
    TrangThai = db.Column(db.Integer, default=1)


class SanPham(db.Model, DictMixin):
    __tablename__ = "SanPham"

    MaSP = db.Column(db.Integer, primary_key=True)
    TenSP = db.Column(db.String(200), nullable=False)
    GiaNiemYet = db.Column(db.Numeric(15, 0), nullable=False, default=0)
    GiaCoBan = db.Column(db.Numeric(15, 0), nullable=False, default=0)
    HinhAnh = db.Column(db.String(255))
    TrangThai = db.Column(db.Integer, default=1)
    Rating = db.Column(db.Numeric(3, 2))
    SoLuotRating = db.Column(db.Integer, default=0)
    MaCategory = db.Column(db.Integer, db.ForeignKey("Category.MaCategory"), nullable=False)

    category = db.relationship("Category")


class OptionGroup(db.Model, DictMixin):
    __tablename__ = "Option_Group"

    MaOptionGroup = db.Column(db.Integer, primary_key=True)
    TenNhom = db.Column(db.String(100), nullable=False)
    IsMultiple = db.Column(db.Integer, default=0)


class OptionValue(db.Model, DictMixin):
    __tablename__ = "Option_Value"

    MaOptionValue = db.Column(db.Integer, primary_key=True)
    TenGiaTri = db.Column(db.String(100), nullable=False)
    GiaThem = db.Column(db.Numeric(15, 0), default=0)
    HinhAnh = db.Column(db.String(255))
    MaOptionGroup = db.Column(db.Integer, db.ForeignKey("Option_Group.MaOptionGroup"), nullable=False)

    group = db.relationship("OptionGroup")


class ProductOptionGroup(db.Model, DictMixin):
    __tablename__ = "Product_Option_Group"

    MaSP = db.Column(db.Integer, db.ForeignKey("SanPham.MaSP"), primary_key=True)
    MaOptionGroup = db.Column(db.Integer, db.ForeignKey("Option_Group.MaOptionGroup"), primary_key=True)


class Cart(db.Model, DictMixin):
    __tablename__ = "Cart"

    MaCart = db.Column(db.Integer, primary_key=True)
    MaUser = db.Column(db.Integer, db.ForeignKey("User.MaUser"), nullable=False)
    MaStore = db.Column(db.Integer, db.ForeignKey("Store.MaStore"), nullable=False)
    NgayTao = db.Column(db.DateTime, default=local_now)


class CartItem(db.Model, DictMixin):
    __tablename__ = "Cart_Item"

    MaCartItem = db.Column(db.Integer, primary_key=True)
    MaCart = db.Column(db.Integer, db.ForeignKey("Cart.MaCart", ondelete="CASCADE"), nullable=False)
    MaSP = db.Column(db.Integer, db.ForeignKey("SanPham.MaSP"), nullable=False)
    SoLuong = db.Column(db.Integer, default=1)
    GiaNiemYet = db.Column(db.Numeric(15, 0), nullable=False)
    GhiChu = db.Column(db.Text)

    product = db.relationship("SanPham")


class CartItemOption(db.Model, DictMixin):
    __tablename__ = "Cart_Item_Option"

    MaCartItem = db.Column(db.Integer, db.ForeignKey("Cart_Item.MaCartItem", ondelete="CASCADE"), primary_key=True)
    MaOptionValue = db.Column(db.Integer, db.ForeignKey("Option_Value.MaOptionValue"), primary_key=True)
    GiaThem = db.Column(db.Numeric(15, 0), default=0)


class Promotion(db.Model, DictMixin):
    __tablename__ = "Promotion"

    MaPromotion = db.Column(db.Integer, primary_key=True)
    Code = db.Column(db.String(50), nullable=False, unique=True)
    LoaiGiamGia = db.Column(db.String(50))
    GiaTri = db.Column(db.Numeric(15, 0), nullable=False)
    GiaTriToiDa = db.Column(db.Numeric(15, 0))
    NgayBatDau = db.Column(db.DateTime)
    NgayKetThuc = db.Column(db.DateTime)
    TrangThai = db.Column(db.Integer, default=1)


class PaymentMethod(db.Model, DictMixin):
    __tablename__ = "Payment_Method"

    MaPayment = db.Column(db.Integer, primary_key=True)
    TenPayment = db.Column(db.String(100), nullable=False)


class Orders(db.Model, DictMixin):
    __tablename__ = "Orders"

    MaOrder = db.Column(db.Integer, primary_key=True)
    MaUser = db.Column(db.Integer, db.ForeignKey("User.MaUser"), nullable=False)
    MaStore = db.Column(db.Integer, db.ForeignKey("Store.MaStore"), nullable=False)
    MaPayment = db.Column(db.Integer, db.ForeignKey("Payment_Method.MaPayment"))
    DiaChiGiao = db.Column(db.Text, nullable=False)
    NguoiNhan = db.Column(db.String(200))
    DienThoaiGiao = db.Column(db.String(20))
    PhiVanChuyen = db.Column(db.Numeric(15, 0), default=0)
    MaPromotion = db.Column(db.Integer, db.ForeignKey("Promotion.MaPromotion"))
    GiamGia = db.Column(db.Numeric(15, 0), default=0)
    TongTien = db.Column(db.Numeric(15, 0), nullable=False)
    TrangThai = db.Column(db.String(50), default="Pending")
    NgayTao = db.Column(db.DateTime, default=local_now)
    ThoiDiemNhanDon = db.Column(db.DateTime)
    ThoiDiemGiaoHang = db.Column(db.DateTime)
    ThoiDiemNhanHang = db.Column(db.DateTime)
    ThoiDiemHuyDon = db.Column(db.DateTime)

    user = db.relationship("User")
    store = db.relationship("Store")
    payment = db.relationship("PaymentMethod")


class OrderItem(db.Model, DictMixin):
    __tablename__ = "Order_Item"

    MaOrderItem = db.Column(db.Integer, primary_key=True)
    MaOrder = db.Column(db.Integer, db.ForeignKey("Orders.MaOrder", ondelete="CASCADE"), nullable=False)
    MaSP = db.Column(db.Integer, db.ForeignKey("SanPham.MaSP"), nullable=False)
    SoLuong = db.Column(db.Integer, default=1)
    GiaNiemYet = db.Column(db.Numeric(15, 0), nullable=False)

    product = db.relationship("SanPham")


class OrderItemOption(db.Model, DictMixin):
    __tablename__ = "Order_Item_Option"

    MaOrderItem = db.Column(db.Integer, db.ForeignKey("Order_Item.MaOrderItem", ondelete="CASCADE"), primary_key=True)
    MaOptionValue = db.Column(db.Integer, db.ForeignKey("Option_Value.MaOptionValue"), primary_key=True)
    GiaThem = db.Column(db.Numeric(15, 0), default=0)


class News(db.Model, DictMixin):
    __tablename__ = "News"

    MaNews = db.Column(db.Integer, primary_key=True)
    TieuDe = db.Column(db.String(255), nullable=False)
    NoiDung = db.Column(db.String(255), nullable=False)
    HinhAnh = db.Column(db.String(255))
    TrangThai = db.Column(db.Integer, default=1)
    NgayTao = db.Column(db.DateTime, default=local_now)
