(function() {

    var Ext = window.Ext4 || window.Ext;

      Ext.define('IterationCardBoard', {
        extend: 'Rally.ui.cardboard.CardBoard',
        alias: 'widget.iterationcardboard',
        plugins: [
          {
              ptype: 'rallytimeboxscrollablecardboard',
              backwardsButtonConfig: {
                  elTooltip: 'Previous Iteration'
              },
              columnRecordsProperty: 'timeboxRecords',
              forwardsButtonConfig: {
                  elTooltip: 'Next Iteration'
              },
              getFirstVisibleScrollableColumn: function(){
                  return this.cmp.getVisibleColumns()[0];
              },
              getLastVisibleScrollableColumn: function(){
                  return _.last(this.cmp.getVisibleColumns());
              },
              getScrollableColumns: function(){
                  return this.cmp.getColumns();
              }
          }
        ],  

        initComponent: function() {
            this.callParent(arguments);
            this.on({
                load: this._normalizeColumnStatusFieldStyles,
                scroll: this._normalizeColumnStatusFieldStyles,
                scope: this
            });
//            this.plugins[0].containerEl = Ext.widget('container', {
//                width: '250'                
//            })
            
            this._initBoard();
            
        },

        showColumn: function(column) {
            this.callParent(arguments);
            column.getStatusCell().removeCls(this.self.COLUMN_HIDDEN_CLS);
        },

        hideColumn: function(column) {
            this.callParent(arguments);
            column.getStatusCell().addCls(this.self.COLUMN_HIDDEN_CLS);
        },

        destroyColumn: function(column) {
            this.callParent(arguments);
            Ext.removeNode(column.getStatusCell().dom);
        },

        createColumnElements: function(afterOrBefore, column) {
            var insertFnName = afterOrBefore === 'after' ? 'insertAfter' : 'insertBefore';

            var els = this.callParent(arguments);

            var statusCell = Ext.DomHelper.createDom(this._getColumnDomHelperConfig({
                tag: 'th',
                cls: 'card-column-status'
            }));
            Ext.fly(statusCell)[insertFnName](column.getStatusCell());

            els.statusCell = statusCell;
            return els;
        },

        _generateHeaderHtml: function() {
            return this.callParent(arguments) + this._generateTableRowHtml({
                tag: 'th',
                cls: 'card-column-status'
            });
        },

        _renderColumns: function() {
            this.addCls('loading');

            if (this.columnDefinitions.length > 0) {

                this._calculateMinWidth();

                var html = [
                    '<table class="column-container">',
                        '<thead class="column-headers">', this._generateHeaderHtml(), '</thead>',
                        '<tbody class="columns">', this._generateContentHtml(), '</tbody>',
                    '</table>'
                ].join('');

                this.getEl().update(html);

                this.showMask(this.maskMsg || 'Loading...');

                var contentCellQuery = this.getEl().query('.columns td'),
                    statusCellQuery  = this.getEl().query('.column-headers th.card-column-status'),
                    headerCellQuery  = this.getEl().query('.column-headers th.card-column');

                var els;

                _.forEach(this.columnDefinitions, function(colDef, idx) {
                    els = {
                        headerCell:  headerCellQuery[idx],
                        statusCell:  statusCellQuery[idx],
                        contentCell: contentCellQuery[idx]
                    };

                    this.renderColumn(colDef, els);
                }, this);

                this.fireEvent('aftercolumnrender', this);
            }
        },

        _normalizeColumnStatusFieldStyles: function() {
            var atLeastOneColumnHasProgressBar = _.some(this.scrollableColumnRecords, function(iteration) {
                iteration = iteration[0];
                var plannedVelocity = iteration.get('PlannedVelocity');
                return Ext.isNumber(plannedVelocity) && plannedVelocity > 0;
            });

            if (atLeastOneColumnHasProgressBar) {
                this.getEl().select('.card-column-status > div').each(function(el) {
                    if (!el.down('.progress-bar')) {
                        el.addCls('empty-status');
                    }
                });
            }
        },
          
      _getInitiallyVisibleTimeboxes: function(){
          if(this.timeboxes.length <= this.numColumns){
              return this.timeboxes;
          }
    
          var previousTimeboxes = [];
          var futureAndCurrentTimeboxes = [];
          Ext.Array.each(this.timeboxes, function(timeboxRecords){
              if(timeboxRecords[0].get('EndDate') >= new Date()){
                  futureAndCurrentTimeboxes.push(timeboxRecords);
              }else{
                  previousTimeboxes.push(timeboxRecords);
              }
          });
          futureAndCurrentTimeboxes = Rally.util.Array.firstElementsOf(futureAndCurrentTimeboxes, this.numColumns);
    
          var possiblyVisibleTimeboxes = previousTimeboxes.concat(futureAndCurrentTimeboxes);
          return Rally.util.Array.lastElementsOf(possiblyVisibleTimeboxes, this.numColumns);
      },
          
      _initBoard: function() {
          this._onTimeboxesLoad(this.store);
      },

      _onTimeboxesLoad: function(store) {
          var likeTimeboxesObj = {};
          store.each(function(timebox) {
              var timeboxKey = Ext.String.format("{0}{1}{2}",
                  timebox.get('Name'), timebox.get('StartDate'), timebox.get('EndDate'));
              likeTimeboxesObj[timeboxKey] = Ext.Array.push(likeTimeboxesObj[timeboxKey] || [], timebox);
          });

          var sortedLikeTimeboxes = Ext.Array.sort(Ext.Object.getValues(likeTimeboxesObj), function(likeTimeboxes1, likeTimeboxes2) {
              return likeTimeboxes1[0].get('EndDate') - likeTimeboxes2[0].get('EndDate');
          });

          this.timeboxes = Ext.Array.filter(sortedLikeTimeboxes, function(likeTimeboxes) {
              return Ext.Array.some(likeTimeboxes, function(timebox) {
                  return Rally.util.Ref.getRelativeUri(timebox.get('Project')) === Rally.util.Ref.getRelativeUri(Rally.environment.getContext().getProject());
              }, this);
          }, this);
          
          var initiallyVisibleTimeboxes = this._getInitiallyVisibleTimeboxes();
          this.columns = this._getColumnConfigs(initiallyVisibleTimeboxes);
          this.columnConfig = {
              xtype: 'iterationplanningboardappplanningcolumn',
              additionalFetchFields: ['PortfolioItem'],
              storeConfig : {
                  fetch: ['Parent', 'Requirement', 'Iteration', 'PlanEstimate']
              },
              dropControllerConfig: {
                  ptype: 'planningcolumndropcontroller'    
              }
          };
          this.cardConfig =  {
              editable: true,
              showIconMenus: true,
              fields: ['Parent', 'Tasks', 'Defects', 'Discussion', 'PlanEstimate']
          };
          
          this.scrollableColumnRecords =  this.timeboxes;

          this.setLoading(false);
      },
          
      _getColumnConfigs: function(timeboxes) {
          var columns = [];

          Ext.Array.each(timeboxes, function(timeboxRecords) {
              columns.push({
                  timeboxRecords: timeboxRecords,
                  columnHeaderConfig: {
                      record: timeboxRecords[0],
                      fieldToDisplay: 'Name',
                      editable: false
                  }
              });
          }, this);

          return columns;
      }
    });
})();