// cur_frm.cscript.sales_invoice_no = function(doc, cdt, cdn){
// 	var d = locals[cdt][cdn]
// 	get_server_fields('get_outstanding_details',d.sales_invoice_no,'', doc, cdt, cdn,1, function(){
// 		refresh_field('payment')
// 	})
// }

cur_frm.fields_dict.payment.grid.get_field('sales_invoice_no').get_query = function(doc, cdt, cdn){
	
    return {
		filters :{
			'docstatus' : 1
		}
	}
}

cur_frm.cscript.onload=function(doc,dt,dn){
     //var d= locals[dt][cdn]
     if(doc.min_payment_amount){
        doc.amount=doc.min_payment_amount
        refresh_field('amount',doc.name,'payment')
     }else{
        doc.amount=doc.outstanding
        refresh_field('amount',doc.name,'payment')

     }

}

cur_frm.cscript.make_payment_inv = function(doc, cdt, cdn){
    var d = locals[cdt][cdn]
    if(parseInt(d.select) == 1)
    {
        if(parseFloat(d.outstanding)>0.0){
            get_server_fields('make_payment','','', doc, cdt, cdn, 1, function(){
                refresh_field('payment')
            })    
        }else{
            alert("Already Payment received")    
        }    
    }else{
        alert("Click on select check box")
    }
	
}

cur_frm.cscript.make_payment = function(doc, cdt, cdn){

	get_server_fields('make_payment','','', doc, cdt, cdn, 1, function(){
		refresh_field('payment')
	})
}

cur_frm.cscript.onload = function(doc, cdt, cdn){
    doc.sales_invoice = ''
    doc.customer_name = ''
    doc.offset = 0

	get_server_fields('show_pending_balance_invoices','','', doc, cdt, cdn, 1, function(r){
		refresh_field('payment')
	})
}


cur_frm.cscript.more = function(doc,cdt,cdn){
    var x = 'more'
    get_server_fields('show_pending_balance_invoices',x,'',doc,cdt,cdn,1,function(){
        refresh_field('offset')
        refresh_field('payment')

    })

}


cur_frm.cscript.search = function(doc,cdt,cdn){
    var obj = {'Customer Name':doc.customer_name,'Sales Invoice':doc.sales_invoice}
    
    if( !obj['Customer Name'] && !obj['Sales Invoice']){
         alert("Please Enter in either Customer Name or Sales invoice Field")
    }
    else{

    var x='search'
    get_server_fields('show_pending_balance_invoices',x,'',doc,cdt,cdn,1,function(){
        refresh_field('offset')
        refresh_field('payment')
        
    })

    }


}









cur_frm.cscript.amount = function(doc, cdt, cdn){
	var d =locals[cdt][cdn]

	if(parseFloat(d.amount) > parseFloat(d.outstanding)){
		d.balance_amount = parseFloat(d.amount) - parseFloat(d.outstanding)	
	}else{
		d.balance_amount = 0.0
	}
    amt = parseFloat(d.amount || 0.0) + parseFloat(d.paid_amount || 0.0) 
	if(d.status != 'Approved' && parseFloat(d.min_payment_amount) > amt){
		d.status = 'Rejected'	
	}else if(parseFloat(d.min_payment_amount) <= amt){
		d.status = 'Approved'
	}
	refresh_field('payment')
}

cur_frm.cscript.select_all = function(doc, cdt, cdn){
	blc = doc.payment || [ ]
	for(i=0; i<blc.length; i++){
		blc[i].select = 1
	}
	refresh_field('payment')
}

cur_frm.cscript.apply_status = function(doc, cdt, cdn){
	blc = doc.payment || [ ]
	for(i=0; i<blc.length; i++){
		blc[i].status = doc.apply_status
	}
	refresh_field('payment')
}



 cur_frm.add_fetch("gv_serial_no", "gift_voucher_amount", "amount")




cur_frm.cscript.work_order_status = function(doc, cdt, cdn){
	var d;
	d = locals[cdt][cdn]
    // new frappe.WorkOrderAction(d, doc, cdt, cdn)    
    if(d.min_payment_percentage){
        if(parseFloat(d.paid_amount) >= parseFloat(d.min_payment_amount)){
            new frappe.WorkOrderAction(d, doc, cdt, cdn)    
        }else{
            alert("You have not paid min amount")
        }    
    }else{
        new frappe.WorkOrderAction(d, doc, cdt, cdn)    
    }
}

cur_frm.cscript.redeem_points = function(doc, cdt, cdn){
    var d = locals[cdt][cdn]
    if(d.mode_of_payment == 'Redeem'){
        get_server_fields('get_redem_amount', d.redeem_points, '', doc, cdt, cdn, 1, function(r){
            if(r){
                refresh_field('amount', d.name, 'payment');
            }
        })
    }
}


cur_frm.cscript.mode_of_payment = function(doc, cdt, cdn){
    var d = locals[cdt][cdn]
    if(d.mode_of_payment == 'Gift Voucher'){
        get_server_fields('get_gv_account','', '', doc, cdt, cdn, 1, function(r){
            if(r){
                refresh_field('payment_account', d.name,'payment');
            }
        })
    }
}





cur_frm.fields_dict.customer_name.get_query = function(doc) {
    if (doc.sales_invoice){
        return{ query:"mreq.mreq.doctype.cashier_dashboard.cashier_dashboard.get_customer_name",
                filters:{'sales_invoice': doc.sales_invoice}
        }
    }
    
}
cur_frm.fields_dict.sales_invoice.get_query = function(doc) {
    if (doc.customer_name){

    return{
        filters:{
            'customer': doc.customer_name
            }
        }

   }
}

cur_frm.fields_dict["payment"].grid.get_field("gv_serial_no").get_query = function(doc,cdt,cdn) {
    var d =locals[cdt][cdn]
    return {
        filters: {
            'customer': d.customer,
            'status': 'Delivered',
            'sales_invoice':''
        }
    }
}







frappe.WorkOrderAction = Class.extend({
    init: function(data, doc, cdt, cdn){
        this.data = data
        this.doc = doc
        this.cdt = cdt
        this.cdn = cdn
        this.make()
        this.render_data()
        this.change_all_status()
        this.save_data()
    },

    make: function(){
        this.dialog = new frappe.ui.Dialog({
            title:__(' Work Order'),
            fields: [
                {fieldtype:'HTML', fieldname:'work_order', label:__('Work Order Status'), reqd:false,
                	description: __("")},
                {fieldtype:'Button', fieldname:'ok', label:__('Ok') }
            ]
        })
        this.controller = this.dialog.fields_dict;
        this.div = $('<div id="status" style="float:left;width:100%;padding:10px;"><div class="control-label small col-xs-2" style="width:15px;margin-left:-10px">All</div><select style="width:150px;float:left; margin-left:11px" class="input-with-feedback form-control"><option value="Null"></option><option value="Pending">Pending</option>\
        			<option value="Hold">Hold</option><option value="Release">Release</option></select>\
        			</div><div id="myGrid" style="float:left;width:100%;height:200px;margin:10px;overflow-x:scroll"><table class="table table-bordered" style="background-color: #ddd;height:10px" id="mytable">\
                    <thead><tr><td>Work Order</td><td>Item</td><td>Status</td></tr></thead><tbody></tbody></table></div>').appendTo($(this.controller.work_order.wrapper))
        this.dialog.show();
    },

    render_data: function(){
        var me = this;
        frappe.call({
        	method : 'erpnext.accounts.accounts_custom_methods.get_work_order_details',
        	args:{
        		'sales_invoice_no': me.data.sales_invoice_no
        	},
        	callback : function(r){
                if(r.message){
                    me.args = r.message;
                    me.make_structure()
                }else{
                    me.dialog.hide()
                    alert("Work order already release")
                }
        	}
        })
    },

    make_structure: function(){
        var me = this;
        $sub_div = $(me.div).find('#mytable tbody')
        $.each(me.args, function(i){
        	$div = $(' <tr style="background-color:#fff"> <td><a href="#Form/Work Order/'+me.args[i].name+'">'+me.args[i].name+'</td>\
        		<td>'+me.args[i].item_code+'</td><td><select class="input-with-feedback form-control"><option id="Pending" value="Pending">Pending</option>\
        		<option id="Hold" value="Hold">Hold</option><option id="Release" value="Release">Release</option></select></td>').appendTo($sub_div)
            // var me_div = this;
            value = me.args[i].release_status
            if(value==''){
                value = 'Pending'
            }
            $div.find('select').val(value);
        })
    },

    change_all_status: function(){
    	var me = this;
    	$(me.div).find('select').click(function(){
    		var value = $(this).val()
    		$.each($(me.div).find('#mytable tbody tr'), function(i){
    			$(this).find('select').val(value)		
    		})
    	})
    },

    save_data: function(){
        var me = this;
        $(me.controller.ok.input).click(function(){
            var $rate_dict = []
            $(me.div).find('#mytable tbody tr').each(function(i) {
                var key = ['work_order', 'item','status']
                var cells = $(this).find('td')
                var $data ={}
                $(cells).each(function(i){
                    $data[key[i]] = $(this).find('select').val() || $(this).text(); 
                })
                $rate_dict.push($data)
            })
            me.status_args = $rate_dict
          	me.change_status()
        })
    },

    change_status: function(){
    	var me = this;
    	frappe.call({
    		method: 'erpnext.accounts.accounts_custom_methods.update_status',
    		args: {
    			'sales_invoice_no': me.data.sales_invoice_no,
    			'args': me.status_args
    		},
    		callback: function(){
    			me.dialog.hide()
                cur_frm.cscript.refresh(me.doc, me.cdt, me.cdn)
    		}
    	})
    }
})